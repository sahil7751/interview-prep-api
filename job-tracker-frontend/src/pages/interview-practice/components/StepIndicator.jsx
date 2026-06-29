export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200
                    px-6 py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step dot */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center
                justify-center text-sm font-bold transition-all
                duration-300 border-2
                ${currentStep === step.id
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                    : currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'}`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <p className={`text-xs mt-1 font-medium whitespace-nowrap
                ${currentStep === step.id
                    ? 'text-indigo-700'
                    : currentStep > step.id
                      ? 'text-green-600'
                      : 'text-gray-400'}`}>
                {step.label}
              </p>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 mb-5 rounded
                transition-all duration-500
                ${currentStep > step.id
                    ? 'bg-green-400'
                    : 'bg-gray-200'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

