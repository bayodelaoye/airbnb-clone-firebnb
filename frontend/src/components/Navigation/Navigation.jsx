import { NavLink, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import ProfileButton from "./ProfileButton";
import OpenModalButton from "../OpenModalButton";
import LoginFormModal from "../LoginFormModal";
import SignupFormModal from "../SignupFormModal";
import "./Navigation.css";
import { FaMagnifyingGlass } from "react-icons/fa6";
import mainLogo from "../../../public/Assets/firebnb-logo-3.png";
import { MdAccountCircle } from "react-icons/md";
import { useState } from "react";

function Navigation({ isLoaded }) {
  const sessionUser = useSelector((state) => state.session.user);
  const [visible, setvisible] = useState(false);

  // const root = document.getElementById("root");
  // document.body.addEventListener("click", () => {
  //   const t = document.getElementById("login-sign-up-btns");
  //   console.log(t);
  // });

  const sessionLinks = sessionUser ? (
    <div className="user-menu-container">
      <div className="three-links">
        <Link>Create a New spot</Link>
        <MdAccountCircle
          className="icon-nav-bar"
          onClick={() => {
            visible ? setvisible(false) : setvisible(true);
          }}
        />
      </div>

      {visible && (
        <li className="drop-down-menu">
          <ProfileButton user={sessionUser} id="login-sign-up-btns" />{" "}
        </li>
      )}
    </div>
  ) : (
    <>
      <li>
        <OpenModalButton
          buttonText="Log In"
          modalComponent={<LoginFormModal />}
          className="login-sign-up-btns"
        />
        {/* <NavLink to="/login">Log In</NavLink> */}
      </li>
      <li>
        <OpenModalButton
          buttonText="Sign Up"
          modalComponent={<SignupFormModal />}
          className="login-sign-up-btns"
        />
        {/* <NavLink to="/signup">Sign Up</NavLink> */}
      </li>
    </>
  );

  return (
    <nav className="nav-bar">
      <NavLink to="/">
        <img src={mainLogo} className="logo" />
      </NavLink>

      <div className="search-box-container">
        <p>Anywhere</p>
        <div className="border-right"></div>
        <p>Any week</p>
        <div className="border-right"></div>
        <p>Add guests</p>
        <div className="circle-magnify-glass">
          <FaMagnifyingGlass className="magnify-glass" />
        </div>
      </div>
      <div className="sing-up-login-btns">{isLoaded && sessionLinks}</div>
    </nav>
  );
}

export default Navigation;
