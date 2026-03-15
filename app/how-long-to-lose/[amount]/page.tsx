import Home from "../../page";
import Link from "next/link";

export default function Page({ params }: { params: { amount: string } }) {
  const amount = params.amount;

  return (
    <div>

      <div style={{textAlign:"center", marginTop:"20px"}}>
        <Link href="/" style={{color:"#4ade80", fontWeight:"bold"}}>
          ← Back to CutForecast Calculator
        </Link>
      </div>

      <h1 style={{textAlign:"center", fontSize:"40px", marginTop:"40px"}}>
        How Long Does It Take To Lose {amount}?
      </h1>

      <p style={{textAlign:"center", maxWidth:"600px", margin:"20px auto"}}>
        Use this calculator to estimate how long it may take to lose {amount}
        based on your calorie deficit and body fat percentage.
      </p>

      <Home />

    </div>
  );
}