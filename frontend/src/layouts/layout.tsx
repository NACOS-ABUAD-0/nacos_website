import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
import { Footer } from "../components/Footer";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
      <Footer/>
    </>
  );
};