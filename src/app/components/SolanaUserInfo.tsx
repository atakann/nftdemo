"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Tooltip, IconButton, Snackbar } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

export function SolanaUserInfo() {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const [balance, setBalance] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        if (publicKey) {
            const fetchBalance = async () => {
                try {
                    const balance = await connection.getBalance(publicKey);
                    setBalance(balance / LAMPORTS_PER_SOL);
                } catch (error) {
                    console.error("Failed to fetch balance:", error);
                    setBalance(null);
                }
            };

            fetchBalance();

            const id = connection.onAccountChange(publicKey, () =>
                fetchBalance()
            );

            return () => {
                connection.removeAccountChangeListener(id);
            };
        } else {
            setBalance(null);
        }
    }, [publicKey, connection]);

    const abbreviatePublicKey = (key: string) => {
        return `${key.slice(0, 4)}...${key.slice(-4)}`;
    };

    const copyToClipboard = () => {
        if (publicKey) {
            navigator.clipboard
                .writeText(publicKey.toBase58())
                .then(() => {
                    setCopied(true);
                    setOpenSnackbar(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch((err) => {
                    console.error("Failed to copy: ", err);
                    setOpenSnackbar(true);
                });
        }
    };

    const handleCloseSnackbar = (
        event?: React.SyntheticEvent | Event,
        reason?: string
    ) => {
        if (reason === "clickaway") {
            return;
        }
        setOpenSnackbar(false);
    };

    if (!publicKey) {
        return null; // Don't render anything if wallet is not connected
    }

    return (
        <>
            <div className="flex items-center space-x-2 text-white">
                <span>
                    {balance !== null
                        ? `${balance.toFixed(2)} SOL`
                        : "Loading..."}
                </span>
                <Tooltip
                    title={
                        <div>
                            <p>Your full public key:</p>
                            <p
                                style={{
                                    fontFamily: "monospace",
                                    wordBreak: "break-all",
                                }}
                            >
                                {publicKey.toBase58()}
                            </p>
                            <p style={{ fontSize: "0.8em", marginTop: "8px" }}>
                                Click the copy icon to copy your public key.
                            </p>
                        </div>
                    }
                    arrow
                >
                    <span>{abbreviatePublicKey(publicKey.toBase58())}</span>
                </Tooltip>
                <IconButton
                    onClick={copyToClipboard}
                    size="small"
                    style={{ color: "white" }}
                >
                    {copied ? (
                        <CheckIcon fontSize="small" />
                    ) : (
                        <ContentCopyIcon fontSize="small" />
                    )}
                </IconButton>
            </div>
            <Snackbar
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                open={openSnackbar}
                autoHideDuration={2000}
                onClose={handleCloseSnackbar}
                message={
                    copied
                        ? "Public key copied to clipboard"
                        : "Failed to copy public key"
                }
            />
        </>
    );
}
