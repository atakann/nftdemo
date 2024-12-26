// src/app/discover/closet/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import {
    getAssetsByOwner,
    fetchNFTDetails,
    extractGroupAddress,
} from "@/utils/getAssets";
import Image from "next/image";
import Link from "next/link";
import { FaExternalLinkAlt } from "react-icons/fa";
import {
    useAnchorWallet,
    useConnection,
    useWallet,
} from "@solana/wallet-adapter-react";
import Card from "@/components/Card";
import Skeleton from "@/components/Skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

import { getNFTDetail, getNFTList } from "@/utils/nftMarket";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface NFTDetail {
    name: string;
    symbol: string;
    image?: string;
    group?: string;
    mint: string;
    seller: string;
    price: string;
    listing: string;
}

const trimAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

const Closet: React.FC = () => {
    const { publicKey } = useWallet();
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [assets, setAssets] = useState<NFTDetail[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const wallet = useAnchorWallet();
    const { connection } = useConnection();
    const [filteredAssets, setFilteredAssets] = useState<NFTDetail[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('default');
    const [selectedGroup, setSelectedGroup] = useState<string>('all_groups');
    const [selectedSeller, setSelectedSeller] = useState<string>('all_sellers');

    const applyFilters = () => {
        let filtered = [...assets];
    
        // search by name
        if (searchTerm) {
            filtered = filtered.filter(asset =>
                asset.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
    
        // filter by price range (convert to SOL)
        if (minPrice) {
            filtered = filtered.filter(asset => 
                parseFloat(asset.price) / 1000000000 >= parseFloat(minPrice)
            );
        }
    
        if (maxPrice) {
            filtered = filtered.filter(asset => 
                parseFloat(asset.price) / 1000000000 <= parseFloat(maxPrice)
            );
        }
    
        // filter by group
        if (selectedGroup && selectedGroup !== 'all_groups') {
            filtered = filtered.filter(asset => asset.group === selectedGroup);
        }
    
        // filter by seller
        if (selectedSeller && selectedSeller !== 'all_sellers') {
            filtered = filtered.filter(asset => asset.seller === selectedSeller);
        }
    
        // sort
        switch (sortBy) {
            case 'price-asc':
                filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                break;
            case 'price-desc':
                filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                break;
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }
    
        setFilteredAssets(filtered);
    };

    useEffect(() => {
        applyFilters();
    }, [searchTerm, minPrice, maxPrice, selectedGroup, selectedSeller, sortBy, assets]);

    const getUniqueGroups = () => {
        const groups = assets.map(asset => asset.group).filter(Boolean);
        return [...new Set(groups)];
    };
    
    const getUniqueSellers = () => {
        const sellers = assets.map(asset => asset.seller).filter(Boolean);
        return [...new Set(sellers)];
    };

    useEffect(() => {
        const storedWalletAddress = sessionStorage.getItem("walletAddress");
        const storedAssets = sessionStorage.getItem("assets");

        if (storedWalletAddress) {
            setWalletAddress(storedWalletAddress);
        }

        if (storedAssets) {
            setAssets(JSON.parse(storedAssets));
        }
        fetchNFTs();
    }, []);

    // useEffect(() => {
    //   fetchAssets();
    // }, [publicKey]);

    useEffect(() => {
        fetchNFTs();
    }, [wallet]);

    useEffect(() => {
        sessionStorage.setItem("walletAddress", walletAddress);
    }, [walletAddress]);

    useEffect(() => {
        sessionStorage.setItem("assets", JSON.stringify(assets));
    }, [assets]);

    const fetchNFTs = async () => {
        setIsLoading(true);
        const provider = new AnchorProvider(connection, wallet as Wallet, {});

        try {
            const listings = await getNFTList(provider, connection);
            // const mint = new PublicKey(listings[0].mint);
            // const detail = await getNFTDetail(mint, connection);
            console.log(listings);
            const promises = listings
                .filter((list) => list.isActive)
                .map((list) => {
                    const mint = new PublicKey(list.mint);
                    return getNFTDetail(
                        mint,
                        connection,
                        list.seller,
                        list.price,
                        list.pubkey
                    );
                });
            const detailedListings = await Promise.all(promises);
            console.log(detailedListings);
            //return detailedListings;

            setAssets(detailedListings);
        } catch (errr) {
            console.log(errr);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 pt-20 bg-white dark:bg-black min-h-screen">
            <h1 className="text-3xl font-bold mb-4 text-center text-black dark:text-white">
                NFTs on sale
            </h1>

            {error && <div className="text-red-500 text-center mb-4">{error}</div>}

            <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex flex-wrap gap-4 items-end justify-between">
                <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                    Search by Name
                </label>
                <Input
                    type="text"
                    placeholder="Search NFTs..."
                    value={searchTerm}
                    onChange={(e) => {
                    setSearchTerm(e.target.value);
                    applyFilters();
                    }}
                    className="w-full"
                />
                </div>
                
                <div className="flex gap-4">
                <div className="w-[120px]">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                    Min Price (SOL)
                    </label>
                    <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                        setMinPrice(e.target.value);
                        applyFilters();
                    }}
                    />
                </div>
                
                <div className="w-[120px]">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                    Max Price (SOL)
                    </label>
                    <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                        setMaxPrice(e.target.value);
                        applyFilters();
                    }}
                    />
                </div>
                </div>

                <div className="w-[200px]">
                    <Select
                        value={sortBy}
                        onValueChange={(value) => {
                            setSortBy(value);
                            applyFilters();
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="price-asc">Price: Low to High</SelectItem>
                            <SelectItem value="price-desc">Price: High to Low</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[200px]">
                    <Select
                        value={selectedGroup}
                        onValueChange={(value) => {
                            setSelectedGroup(value);
                            applyFilters();
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_groups">All Groups</SelectItem>
                            {getUniqueGroups().map((group) => (
                                <SelectItem key={group} value={group}>
                                    {trimAddress(group)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-[200px]">
                    <Select
                        value={selectedSeller}
                        onValueChange={(value) => {
                            setSelectedSeller(value);
                            applyFilters();
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Seller" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_sellers">All Sellers</SelectItem>
                            {getUniqueSellers().map((seller) => (
                                <SelectItem key={seller} value={seller}>
                                    {trimAddress(seller)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                variant="outline"
                onClick={() => {
                    setSearchTerm('');
                    setMinPrice('');
                    setMaxPrice('');
                    setSortBy('default');
                    setSelectedGroup('all_groups');
                    setSelectedSeller('all_sellers');
                    setFilteredAssets(assets);
                }}
                >
                Clear Filters
                </Button>
            </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <Card key={index}>
                            <Skeleton className="h-64 w-full mb-4" />
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </Card>
                    ))}
                </div>
            ) : assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAssets.map((asset: NFTDetail) => (
                        <div
                            key={asset.mint}
                            className="relative p-4 border rounded shadow hover:shadow-lg transition-transform transform hover:scale-105 cursor-pointer bg-white dark:bg-black group"
                        >
                            <Link href={`/marketplace/${asset.mint}`}>
                                <div className="relative h-64 w-full mb-4">
                                    {asset.image ? (
                                        <Image
                                            src={asset.image}
                                            alt={`Asset ${asset.mint}`}
                                            layout="fill"
                                            objectFit="contain"
                                            className="rounded"
                                        />
                                    ) : (
                                        <p>No Image Available</p>
                                    )}
                                </div>
                            </Link>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity flex flex-col justify-end items-center opacity-0 group-hover:opacity-100 text-white text-xs p-2">
                                <p className="font-semibold">{asset.name || "Unknown"}</p>
                                <Link
                                    href={`https://solana.fm/address/${asset.mint}`}
                                    target="_blank"
                                    className="hover:text-gray-300 flex items-center"
                                >
                                    {trimAddress(asset.mint)}{" "}
                                    <FaExternalLinkAlt className="ml-1" />
                                </Link>
                                {asset.group && (
                                    <Link
                                        href={`https://solana.fm/address/${asset.group}`}
                                        target="_blank"
                                        className="hover:text-gray-300 flex items-center"
                                    >
                                        Group: {trimAddress(asset.group)}{" "}
                                        <FaExternalLinkAlt className="ml-1" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <h2 className="text-2xl font-bold mb-4 text-center text-red-500 dark:text-yellow">
                    No NFTs on sale
                </h2>
            )}
        </div>
    );
};

export default Closet;
