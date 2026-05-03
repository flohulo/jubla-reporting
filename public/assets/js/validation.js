/**
 * Validation logic for reporting forms.
 */
const VALIDATION = {
    /**
     * Validates the main report form.
     * @returns {string|null} Error message or null if valid.
     */
    validateReport(form) {
        const cfg = (window.APP_CONFIG && window.APP_CONFIG.validationMessages) || {
            allFieldsRequired: "Bitte alle Pflichtfelder ausfüllen.",
            leadersRequired: "Bitte Hauptleitung und Hilfsleitung ausfüllen.",
            partnerRequired: "Bitte Partner/in ausfüllen.",
            remarksRequired: "Bei Dynamik 4/5 sind Bemerkungen Pflicht."
        };

        if (!form.datum || form.anzahl === "" || form.leiterCount === "") {
            return cfg.allFieldsRequired;
        }
        if (form.checked && (!form.hl || !form.hilfs)) {
            return cfg.leadersRequired;
        }
        if (!form.checked && !form.partner) {
            return cfg.partnerRequired;
        }
        if (parseInt(form.dynamik) >= 4 && !form.bemerkungen) {
            return cfg.remarksRequired;
        }
        return null;
    }
};
