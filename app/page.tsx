import Card from "./components/Card";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Link href="/dashboard"><Card>Dashboard</Card></Link>
      <Link href="/screening"><Card>Skrining</Card></Link>
      <Link href="/study"><Card>Belajar</Card></Link>
    </div>
  );
}
