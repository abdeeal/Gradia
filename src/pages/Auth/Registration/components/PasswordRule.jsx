const PasswordRule = ({ valid, label }) => {
  return (
    <div className="flex items-center gap-2">
      <i
        className={`${
          valid ? "ri-checkbox-circle-fill" : "ri-close-circle-fill"
        }`}
        style={{ color: valid ? "#22c55e" : "#ef4444" }}
      />
      <span
        className={`${valid ? "text-green-400" : "text-red-400"}`}
      >
        {label}
      </span>
    </div>
  );
};

export default PasswordRule