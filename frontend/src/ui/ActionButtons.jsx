const ActionButtons = ({ handleSubmit, pending }) => (
  <>
    <button
      disabled={pending}
      type="button"
      onClick={handleSubmit}
      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {pending ? "En cours..." : "Enregistrer"}
    </button>
  </>
);

export default ActionButtons;
