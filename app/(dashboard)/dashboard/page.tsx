import { currentUser } from "@clerk/nextjs/server";

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    return <div>NOT LOGIN</div>;
  }

  return <div>LOGIN: {user.firstName}</div>;
}