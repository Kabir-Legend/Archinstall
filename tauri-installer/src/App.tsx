import { useInstallerStore } from "./store/installer";
import Welcome from "./pages/Welcome";
import RegionTimezone from "./pages/RegionTimezone";
import KeyboardLayout from "./pages/KeyboardLayout";
import DiskSelection from "./pages/DiskSelection";
import Filesystems from "./pages/Filesystems";
import Bootloader from "./pages/Bootloader";
import InstallType from "./pages/InstallType";
import DesktopEnvironments from "./pages/DesktopEnvironments";
import LoginManager from "./pages/LoginManager";
import Authentication from "./pages/Authentication";
import Services from "./pages/Services";
import Summary from "./pages/Summary";
import InstallerHelp from "./pages/secondary/InstallerHelp";
import RootPassword from "./pages/secondary/RootPassword";
import UserAccounts from "./pages/secondary/UserAccounts";
import AddUser from "./pages/secondary/AddUser";

const MAIN_PAGES = [
  Welcome,
  RegionTimezone,
  KeyboardLayout,
  DiskSelection,
  Filesystems,
  Bootloader,
  InstallType,
  DesktopEnvironments,
  LoginManager,
  Authentication,
  Services,
  Summary,
];

export default function App() {
  const { currentStep, secondaryPage } = useInstallerStore();

  const MainPage = MAIN_PAGES[currentStep] ?? Welcome;

  const renderSecondary = () => {
    switch (secondaryPage) {
      case "help":
        return <InstallerHelp />;
      case "root-password":
        return <RootPassword />;
      case "user-accounts":
        return <UserAccounts />;
      case "add-user":
        return <AddUser />;
      default:
        return null;
    }
  };

  const secondary = renderSecondary();

  return (
    <div className="app-bg">
      {secondary ? secondary : <MainPage key={currentStep} />}
    </div>
  );
}
