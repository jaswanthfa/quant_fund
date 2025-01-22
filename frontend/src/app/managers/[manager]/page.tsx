'use client';
import React, { useState } from "react";
import axios from "axios";
import Dropdown from "../../components/Dropdown";
import { useRouter } from 'next/navigation';
const QuarterlyHoldings = () => {
    const router = useRouter();
    const [filerName, setFilerName] = useState("");
    const [filteredManagers, setFilteredManagers] = useState<string[]>([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    interface Holding {
        filer_name: string;
        quarter: string;
        total_value: number;
        total_holdings: number;
        filing_id: string;
    }
    
    const [data, setData] = useState<Holding[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const rowsPerPage = 50;
    const [currentPage, setCurrentPage] = useState(1);

    interface Filing {
        filer_name: string;
        [key: string]: string | number;
    }

    interface GroupedFilings {
        [key: string]: Filing[];
    }

    const fetchManagers = async (query: string): Promise<void> => {
        try {
            if (query.trim() === "") {
                setFilteredManagers([]);
                setDropdownVisible(false);
                return;
            }
            const response = await axios.get<Filing[]>(
                `http://127.0.0.1:8000/filings/${encodeURIComponent(query)}`
            );
            const filings = response.data;

            const groupedFilings: GroupedFilings = filings.reduce((acc: GroupedFilings, filing: Filing) => {
                const { filer_name } = filing;
                if (!acc[filer_name]) acc[filer_name] = [];
                acc[filer_name].push(filing);
                return acc;
            }, {});

            setFilteredManagers(Object.keys(groupedFilings));
            setDropdownVisible(true);
        } catch (err) {
            console.error("Error fetching managers:", err);
        }
    };

    const fetchQuarterlyHoldings = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(
                `http://127.0.0.1:8000/managers/${encodeURIComponent(filerName)}/`
            );
            setData(response.data);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || "An error occurred while fetching data.");
            } else {
                setError("An error occurred while fetching data.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();
        if (filerName.trim() === "") {
            setError("Filer name cannot be empty.");
            return;
        }
        fetchQuarterlyHoldings();
    };    from sqlalchemy import (
        Column,
        String,
        ForeignKey,
        BigInteger,
        DateTime,
        Date,
        create_engine,
        UniqueConstraint,
        ForeignKeyConstraint
    )
    from sqlalchemy.orm import declarative_base, relationship
    from datetime import datetime
    import uuid
    
    Base = declarative_base()
    
    class Filing(Base):
        __tablename__ = 'filings'
    
        filing_id = Column(String(36), primary_key=True, nullable=False)
        cik = Column(String(60), nullable=False)
        filer_name = Column(String(100), nullable=False)
        period_of_report = Column(Date, nullable=False)
        filed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
        # Relationship
        holdings = relationship("Holding", back_populates="filing", cascade="all, delete")        from sqlalchemy import (
            Column,
            String,
            ForeignKey,
            BigInteger,
            DateTime,
            Date,
            create_engine,
            UniqueConstraint,
            ForeignKeyConstraint
        )
        from sqlalchemy.orm import declarative_base, relationship
        from datetime import datetime
        import uuid
        
        Base = declarative_base()
        
        class Filing(Base):
            __tablename__ = 'filings'
        
            filing_id = Column(String(36), primary_key=True, nullable=False)
            cik = Column(String(60), nullable=False)
            filer_name = Column(String(100), nullable=False)
            period_of_report = Column(Date, nullable=False)
            filed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
        
            # Relationship
            holdings = relationship("Holding", back_populates="filing", cascade="all, delete")

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const query = e.target.value;
        setFilerName(query);
        fetchManagers(query);
    };

    const handleDropdownSelection = (selectedName: string): void => {
        setFilerName(selectedName);
        setDropdownVisible(false);
    };

    const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    interface PageChangeHandler {
        (page: number): void;
    }

    const handlePageChange: PageChangeHandler = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="w-full h-screen bg-white">
            <div className="container mx-auto p-6 shadow-md h-[90vh]">
                <h1 className="text-2xl font-bold mb-4 text-black">
                    Quarterly Holdings Search
                </h1>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Enter filer name"
                        value={filerName}
                        onChange={handleInputChange}
                        className="border border-black rounded p-2 w-1/2 text-black"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-black px-4 py-2 rounded ml-2 hover:bg-blue-600"
                    >
                        Search
                    </button>

                    {/* Dropdown Component */}
                    {dropdownVisible && (
                        
                        <Dropdown
                            filteredManagers={filteredManagers}
                            onSelect={handleDropdownSelection}
                        />
                    )}
                </form>

                {/* Loading and Error States */}
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}

                {/* Data Table */}
                {!loading && !error && data.length > 0 && (
                    <div className="overflow-x-auto h-[70%] overflow-y-scroll">
                        <table className="table-auto w-full border border-black">
                            <thead>
                                <tr className="bg-gray-100 text-black">
                                    <th className="border border-black px-4 py-2">Filer Name</th>
                                    <th className="border border-black px-4 py-2">Quarter</th>
                                    <th className="border border-black px-4 py-2">Total Value</th>
                                    <th className="border border-black px-4 py-2">Total Holdings</th>
                                    <th className="border border-black px-4 py-2">Filing ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                                    >
                                        <td className="border border-black px-4 py-2 text-black">
                                            {item.filer_name}
                                        </td>
                                        <td className="border border-black px-4 py-2 text-black">
                                            {item.quarter}
                                        </td>
                                        <td className="border border-black px-4 py-2 text-black">
                                            ${item.total_value.toLocaleString()}
                                        </td>
                                        <td className="border border-black px-4 py-2 text-black">
                                            {item.total_holdings}
                                        </td>
                                        <td className="border border-black px-4 py-2 text-black">
                                            {item.filing_id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && !error && totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => handlePageChange(index + 1)}
                                className={`px-3 py-1 mx-1 rounded ${
                                    currentPage === index + 1
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200 text-black hover:bg-gray-300"
                                }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}

                {/* No Data Message */}
                {!loading && !error && data.length === 0 && (
                    <p className="text-gray-700">
                        No quarterly holdings data available. Try another filer name.
                    </p>
                )}
            </div>
        </div>
    );
};

export default QuarterlyHoldings;