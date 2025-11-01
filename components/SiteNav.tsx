import CardNav from "@/components/CardNav";
import logo from "@/public/icon.svg";

const SiteNav = () => (
  <CardNav
    logo={logo}
    logoAlt="RedSparkTrade"
    appName="RedSparkTrade"
    topLinks={[
      { label: "Home", href: "/" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "#contact" },
    ]}
    items={[
      {
        label: "About",
        bgColor: "#0D0716",
        textColor: "#fff",
        links: [
          { label: "Company", ariaLabel: "About Company", href: "#" },
          { label: "Careers", ariaLabel: "About Careers", href: "#" },
        ],
      },
      {
        label: "Projects",
        bgColor: "#170D27",
        textColor: "#fff",
        links: [
          { label: "Featured", ariaLabel: "Featured Projects", href: "#" },
          { label: "Case Studies", ariaLabel: "Project Case Studies", href: "#" },
        ],
      },
      {
        label: "Contact",
        bgColor: "#271E37",
        textColor: "#fff",
        links: [
          { label: "Email", ariaLabel: "Email us", href: "#" },
          { label: "Twitter", ariaLabel: "Twitter", href: "#" },
          { label: "LinkedIn", ariaLabel: "LinkedIn", href: "#" },
        ],
      },
    ]}
    baseColor="rgba(255, 255, 255, 0.08)"
    menuColor="#fff"
    buttonBgColor="#111"
    buttonTextColor="#fff"
    ease="power3.out"
    showHamburger={false}
  />
);

export default SiteNav;