import axios from 'axios';

const API_KEY = import.meta.env.VITE_STATE_CITY_API;
const STATE_URL = import.meta.env.VITE_STATE_URL;
const CITY_URL_BASE = import.meta.env.VITE_CITY_URL;

const locationService = {
    /**
     * Fetch all states for India
     * @returns {Promise<Array>} List of states {id, name, iso2}
     */
    getStates: async () => {
        try {
            const response = await axios.get(STATE_URL, {
                headers: {
                    'X-CSCAPI-KEY': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching states:', error);
            throw error;
        }
    },

    /**
     * Fetch cities for a specific state
     * @param {string} stateCode - ISO2 code of the state
     * @returns {Promise<Array>} List of cities {id, name}
     */
    getCities: async (stateCode) => {
        if (!stateCode) return [];
        try {
            // URL format: https://api.countrystatecity.in/v1/countries/IN/states/{stateCode}/cities
            const url = `${CITY_URL_BASE}/${stateCode}/cities`;
            const response = await axios.get(url, {
                headers: {
                    'X-CSCAPI-KEY': API_KEY
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching cities for state ${stateCode}:`, error);
            throw error;
        }
    }
};

export default locationService;
