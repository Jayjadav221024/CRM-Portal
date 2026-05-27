import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import styles from "./LoginPage.module.css";
import img from "../public/7015971.jpg"

export default function LoginPage() {
  const navigate = useNavigate();

  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("admin@crm.com");
  const [password, setPassword] = useState("Admin@123");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await login({
      email,
      password,
    });

    console.log(result);

    if (result.success) {
      navigate("/");
    } else {
      alert("Login Failed");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.imagebar}>
          <div className={styles.add}>
            <img src={img} alt="" srcset="" className={styles.img}/>
          </div>
      </div>
      <div>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1>Welcome back</h1>
        <p>Sign in to your CRM account</p>

        <div className={styles.field}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className={styles.button}>
          Sign In
        </button>

        <div className={styles.demo}>
          <h3>DEMO ACCOUNTS</h3>

          <div className={styles.accounts}>
            <span>Admin</span>
            <span>Manager</span>
            <span>Sales</span>
          </div>
        </div>
      </form>
      </div>
    </div>

  );
}