'use client'

import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import Dropdown from "./components/Dropdown";

const Home = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredManagers, setFilteredManagers] = useState([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchFilings = async (filerName) => {
        try {
            setLoading(true);
            setError("");
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
            const response = await axios.get(`${API_BASE_URL}/filings/${filerName}`);
            const filings = response.data;

            // Group filings by filer_name (manager name)
            const groupedFilings = filings.reduce((acc, filing) => {
                const { filer_name } = filing;
                if (!acc[filer_name]) acc[filer_name] = [];
                acc[filer_name].push(filing);
                return acc;
            }, {});

            // Update state with filtered managers and filings
            setFilteredManagers(Object.keys(groupedFilings));
            
        } catch (err) {
            setError(err.response?.data?.detail || "Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    // Handle search input change
    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.length > 0) {
            fetchFilings(query);
            setDropdownVisible(true);
        } else {
            setFilteredManagers([]);
            setDropdownVisible(false);
            
        }
    };

    return (
                <div className="bg-gray-100">
                    <div className="flex flex-col h-screen md:min-w-max">
                        <div className="flex-1 p-3 sm:p-8 md:mt-14">
                            <div className="flex flex-col w-full sm:max-w-xl h-full mx-auto">
                                <h1 className="mt-22 mb-4 text-[28px] font-medium leading-[45px] text-[#21385F] sm:mt-32 sm:text-5xl">
                                    Search 13F Filings
                                </h1>
                                <div className="relative mb-12">
                                    {/* SearchBar Component */}
                                    <SearchBar
                                        searchQuery={searchQuery}
                                        handleInputChange={handleInputChange}
                                        aria-label="Search for 13F filings"
                                    />
                                    {/* Dropdown Component */}
                                    {dropdownVisible && (
                                        <Dropdown
                                            filteredManagers={filteredManagers}
                                            
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );

};

export default Home;