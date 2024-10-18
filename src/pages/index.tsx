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
import { Layout } from "../components/Layout";
import { withSession } from "../session";
import { NutritionalValues } from "../components/NutritionalValues/NutritionalValues";

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

  return (
    <Layout>
      <div className="max-w-md gap-2 flex flex-col">
        <h1 className="flex flex-row gap-2 font-bold justify-center">
          <CircleCheckBig color="green" /> Logged with FitBit{" "}
        </h1>
        <NutritionalValues
          foodName={props.foodLog.loggedFood.name}
          mealTypeId={props.foodLog.loggedFood.mealTypeId}
          date={props.foodLog.logDate}
          {...props.foodLog.nutritionalValues}
        />
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
