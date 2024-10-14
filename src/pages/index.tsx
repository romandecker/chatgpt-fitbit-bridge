import { isPast, subMinutes } from "date-fns";
import {
  Amphora,
  CircleCheckBig,
  Donut,
  Drumstick,
  Flame,
  Leaf,
  Popcorn,
  Tag,
} from "lucide-react";
import { beginLogin, refreshTokenSet } from "../auth/auth";
import {
  CreateFoodLogResponse,
  createFoodLogSchema,
  FitBitApi,
} from "../fitbit";
import { Layout } from "../Layout";
import { withSession } from "../session";

export type HomeProps = CreateFoodLogResponse | ErrorProps;
interface ErrorProps {
  errorMessage: string;
  retryUrl: string;
}

function hasError(props: HomeProps): props is ErrorProps {
  return "errorMessage" in props;
}

export default function Home(props: HomeProps) {
  if (hasError(props)) {
    return (
      <Layout>
        <p>
          Oh no! Something went wrong when sending the food log to FitBit. I was
          too lazy to code a proper error screen, you can see the ugly details
          below.
        </p>
        <a className="underline" href={props.retryUrl}>
          Re-authenticate and try again
        </a>
        <pre className="w-full overflow-scroll">{props.errorMessage}</pre>
      </Layout>
    );
  }

  const n = props.foodLog.nutritionalValues;
  const values = [
    { Icon: Tag, label: "Name", value: props.foodLog.loggedFood.name },
    { Icon: Flame, label: "Calories", value: `${n.calories} kcal` },
    { Icon: Drumstick, label: "Protein", value: `${n.protein} g` },
    { Icon: Donut, label: "Carbs", value: `${n.carbs} g` },
    { Icon: Amphora, label: "Fat", value: `${n.fat} g` },
    { Icon: Leaf, label: "Fiber", value: `${n.fiber} g` },
    { Icon: Popcorn, label: "Sodium", value: `${n.sodium} mg` },
  ];

  return (
    <Layout>
      <div className="max-w-md gap-2 flex flex-col">
        <h1 className="flex flex-row gap-2 font-bold justify-center">
          <CircleCheckBig color="green" /> Logged with FitBit{" "}
        </h1>
        <ul className="flex flex-col gap-1">
          {values.map(({ Icon, label, value }) => (
            <li className="flex flex-row justify-between" key={label}>
              <span className="flex flex-row gap-1 mr-2">
                <Icon />
                {label}:
              </span>
              <span>{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}

export const getServerSideProps = withSession(async (ctx) => {
  if (!ctx.session.data.tokenSet) {
    const { state, code_verifier, loginUrl } = await beginLogin();

    ctx.session.data.state = state;
    ctx.session.data.code_verifier = code_verifier;
    ctx.session.data.postLoginReturnUrl = ctx.resolvedUrl;
    ctx.session.save();

    return {
      redirect: {
        permanent: false,
        destination: loginUrl,
      },
    };
  } else if (isPast(subMinutes(ctx.session.data.tokenSet.expiresAt, 1))) {
    console.log(
      "Refreshing tokens because access token expires at",
      ctx.session.data.tokenSet.expiresAt
    );
    try {
      const tokenSet = await refreshTokenSet(
        ctx.session.data.tokenSet.refresh_token
      );
      ctx.session.data.tokenSet = tokenSet;
      ctx.session.save();
    } catch (e) {
      // If something goes wrong, drop the entire session and re-authenticate
      console.warn(e);
      ctx.session.data = {};
      ctx.session.save();

      return {
        redirect: {
          permanent: false,
          destination: ctx.resolvedUrl,
        },
      };
    }
  }

  try {
    const fitbit = new FitBitApi(ctx.session.data.tokenSet);
    const foodLogPayload = createFoodLogSchema.parse(ctx.query, {
      path: ["query parameters"],
    });
    const props = await fitbit.createFoodLog(foodLogPayload);
    return { props };
  } catch (e) {
    console.warn(e);
    const retryUrl = `/api/auth/logout?returnTo=${encodeURIComponent(
      ctx.resolvedUrl
    )}`;
    if (e instanceof Error) {
      return {
        props: { errorMessage: e.message, retryUrl },
      };
    } else {
      return {
        props: {
          errorMessage: "Unknown error, check the server logs",
          retryUrl,
        },
      };
    }
  }
});
