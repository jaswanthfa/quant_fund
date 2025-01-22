'use client';

import { useRouter } from 'next/navigation';

const Dropdown = ({ filteredManagers }) => {
    const router = useRouter();

    const handleManagerClick = (manager) => {
        router.push(`/managers/${encodeURIComponent(manager)}`);
    };

    return (
        <div className="absolute z-10 w-[335px] sm:w-[600px] bg-white border border-gray-300 rounded shadow-md mt-1">
            <div className="p-2">
                <h3 className="text-xl text-black font-medium">Managers</h3>
                {filteredManagers.length > 0 ? (
                    filteredManagers.map((manager, index) => (
                        <div
                            key={index}
                            className="px-3 py-2 leading-6 hover:bg-indigo-300 text-xl text-indigo-600 cursor-pointer"
                            onClick={() => handleManagerClick(manager)}
                        >
                            {manager}
                        </div>
                    ))
                ) : (
                    <div className="px-3 py-2 text-gray-500">No results found</div>
                )}
            </div>
        </div>
    );
};

export default Dropdown;