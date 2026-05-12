import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { supabase } from "../../../services/supabaseClient";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserName(data.user.user_metadata?.name ?? "Usuario");
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const initial = userName.charAt(0).toUpperCase()

  return (
    <div className={styles.navbar}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {initial}
        </div>
        <span className={styles.userName}>{userName}</span>
      </div>
      <button 
        className={styles.logoutButton}
        onClick={handleLogout}
      >
        <LogOut size={16} />
        Salir
      </button>
    </div>
  );
};

export default Navbar;
