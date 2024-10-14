import localFont from "next/font/local";
import {
  Tag,
  CircleCheckBig,
  Flame,
  Amphora,
  Drumstick,
  Popcorn,
  Leaf,
  Donut,
} from "lucide-react";
import { beginLogin, refreshTokenSet } from "../auth/auth";
import { withSession } from "../session";
import {
  CreateFoodLogResponse,
  createFoodLogSchema,
  FitBitApi,
} from "../fitbit";
import { isPast, subMinutes } from "date-fns";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export type HomeProps = CreateFoodLogResponse | ErrorProps;
interface ErrorProps {
  errorMessage: string;
}

function hasError(props: HomeProps): props is ErrorProps {
  return "errorMessage" in props;
}

export default function Home(props: HomeProps) {
  if (hasError(props)) {
    return (
      <div
        className={`${geistSans.variable} ${geistMono.variable} flex justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
      >
        <main className="flex flex-col gap-8 row-start-2 items-center ">
          <p>
            Oh no! Something went wrong when sending the food log to FitBit. I
            was too lazy to code a proper error screen, so here&apos;s the ugly
            details:
          </p>
          <pre>{props.errorMessage}</pre>
        </main>
      </div>
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
    <div
      className={`${geistSans.variable} ${geistMono.variable} flex justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center ">
        <h1 className="flex flex-row gap-2 font-bold">
          <CircleCheckBig color="green" /> Logged with FitBit
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
      </main>
    </div>
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
    if (e instanceof Error) {
      return { props: { errorMessage: e.message } };
    } else {
      return {
        props: { errorMessage: "Unknown error, check the server logs" },
      };
    }
  }
});
