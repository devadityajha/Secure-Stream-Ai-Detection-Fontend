// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <App />
//   </StrictMode>
// );

// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";

// // 1. Import your Providers
// import { ProctoringProvider } from "./context/ProctoringContext";

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     {/* 2. Wrap the App. Order matters: Put Auth first if Proctoring needs user data */}
//     <AuthProvider>
//       <ProctoringProvider>
//         <App />
//       </ProctoringProvider>
//     </AuthProvider>
//   </StrictMode>
// );

// main.jsx
import { ProctoringProvider } from "./context/ProctoringContext";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// import { ProctoringProvider } from './context/ProctoringContext';

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Remove AuthProvider from here */}
    <ProctoringProvider>
      <App />
    </ProctoringProvider>
  </StrictMode>
);
