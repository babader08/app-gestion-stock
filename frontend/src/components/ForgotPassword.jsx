import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailStep from "../ui/EmailStep";
import NewPasswordStep from "../ui/NewPasswordStep";

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  return (
    <div className="auth-container space-y-3">
      <h2>Réinitialisation du mot de passe</h2>

      {step === 1 && (
        <EmailStep
          email={email}
          setEmail={setEmail}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <NewPasswordStep
          onSuccess={() => navigate("/login")}
          onBack={() => setStep(1)}
        />
      )}
    </div>
  );
};

export default ForgotPassword;
