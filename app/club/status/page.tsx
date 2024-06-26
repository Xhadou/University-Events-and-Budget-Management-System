'use client'

import { useEffect, useState } from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {toast} from "@/components/ui/use-toast";

interface Event {
    eventid: number;
    eventname: string;
    status: string;
    allocatedbudget: number;
    reason: string;
}

interface BudgetRequest {
    requestid: number;
    eventid: number;
    eventname: string;
    requestedamount: number;
    allocatedamount: number;
    adminfeedback: string;
    status: string;
}

function setlocal(key: string, value: string) {
    typeof window !== 'undefined' ? window.localStorage.setItem(key, value) : null;
}

function getlocal(key: string) {
    const value = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return value;
}

export default function Home() {
    const router = useRouter()
    const searchParams = useSearchParams();
    const email = searchParams.get('email') ?? logout();
    const [events, setEvents] = useState<Event[]>([]);
    const [budgetRequests, setBudgetRequests] = useState<BudgetRequest[]>([]);
    const logemail = getlocal("email")
    if(email!==logemail){
        logout();
    }

    useEffect(() => {
        // Function to fetch events
        const fetchEvents = async () => {
            const { data: clubsData, error: clubsError } = await supabase
                .from('clubs')
                .select('clubid')
                .eq('email', email)
                .single();

            if (clubsError) {
                console.error('Error fetching club ID:', clubsError);
                toast({"title":"Error fetching club ID", "description": clubsError.message})
                return;
            }

            const clubID = clubsData?.clubid;

            if (!clubID) {
                console.error('Club ID not found for email:', email);
                toast({"title":"Club ID not found for email", "description": email})
                return;
            }

            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('eventid, eventname, status, allocatedbudget, reason')
                .eq('clubid', clubID)
                .gte('date', new Date().toISOString().slice(0, 10))
                .order('date', { ascending: true });

            if (eventsError) {
                console.error('Error fetching events:', eventsError);
                toast({"title":"Error fetching events", "description": eventsError.message})
                return;
            }

            setEvents(eventsData || []);
        };

        fetchEvents();
    }, [email]);

    useEffect(() => {
        // Function to fetch budget requests
        const fetchBudgetRequests = async () => {
            const { data: clubsData, error: clubsError } = await supabase
                .from('clubs')
                .select('clubid')
                .eq('email', email)
                .single();

            if (clubsError) {
                console.error('Error fetching club ID:', clubsError);
                toast({"title":"Error fetching club ID", "description": clubsError.message})
                return;
            }

            const clubID = clubsData?.clubid;

            if (!clubID) {
                console.error('Club ID not found for email:', email);
                toast({"title":"Club ID not found for email", "description": email})
                return;
            }

            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('eventid')
                .eq('clubid', clubID);

            if (eventsError) {
                console.error('Error fetching events:', eventsError);
                toast({"title":"Error fetching events", "description": eventsError.message})
                return;
            }

            const eventIDs = eventsData?.map((event: { eventid: any; }) => event.eventid);

            if (!eventIDs || eventIDs.length === 0) {
                console.error('No events found for club ID:', clubID);
                toast({"title":"No events found for club ID", "description": clubID})
                return;
            }

            const { data: budgetRequestsData, error: budgetRequestsError } = await supabase
                .from('budgetrequests')
                .select('requestid, eventid, requestedamount, allocatedamount, adminfeedback, status')
                .in('eventid', eventIDs);

            if (budgetRequestsError) {
                console.error('Error fetching budget requests:', budgetRequestsError);
                toast({"title":"Error fetching budget requests", "description": budgetRequestsError.message})
                return;
            }

            const requestsWithEventNames = budgetRequestsData?.map((request: { eventid: number; }) => {
                const relatedEvent = events.find((event) => event.eventid === request.eventid);
                return { ...request, eventname: relatedEvent?.eventname || 'Unknown'};
            });

            // @ts-ignore
            setBudgetRequests(requestsWithEventNames || []);
        };

        fetchBudgetRequests();
    }, [email, events]);

    function logout(){
        window.history.replaceState(null, '', window.location.pathname);
        router.push("/")
        setlocal("email", "");
        return "";
    }

    return (
        <main className="flex h-screen w-full flex-col justify-between bg-gray-100 overflow-y-hidden">
            <div className="w-full h-full flex justify-center items-center">
                <div className="w-10/12 h-full px-8 pt-6 bg-white rounded-lg shadow-md flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">Your Requests</h1>
                    <div className="w-full h-full flex flex-row items-center justify-center">
                        <div className="h-full w-4/6 items-center justify-center flex flex-col overflow-y-hidden">
                            <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">Events</h1>
                            <Separator />
                            <ScrollArea className="h-full w-full items-center py-5 flex flex-col">
                                {events.map((event) => (
                                    <div key={event.eventid} className="h-auto w-[500px] rounded-xl border border-gray-300 py-4 px-8 mb-5">
                                        <p className="text-xl">Event: {event.eventname}</p>
                                        <p className="text-xl mt-3">Status: {event.status}</p>
                                        <p className="text-xl mt-3">Allocated Amount: {event.allocatedbudget}</p>
                                        {event.status === 'Rejected' && <p className="text-xl mt-3">Reason: {event.reason}</p>}
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>

                        <div className="h-full w-4/6 items-center justify-center flex flex-col">
                            <h1 className="text-2xl font-bold text-gray-700 text-center mb-4">Reimbursement Requests</h1>
                            <Separator />
                            <ScrollArea className="h-full w-full items-center py-5 flex flex-col">
                                {budgetRequests.map((request) => (
                                    <div key={request.requestid} className="h-auto w-[500px] rounded-xl border border-gray-300 py-4 px-8 mb-5">
                                        <p className="text-xl">Event: {request.eventname}</p>
                                        <p className="text-xl mt-3">Requested Amount: {request.requestedamount}</p>
                                        <p className="text-xl mt-3">Status: {request.status}</p>
                                        {request.status === 'Approved' && <p className="text-xl mt-3">Allocated Amount: {request.allocatedamount}</p>}
                                        {request.status === 'Rejected' && <p className="text-xl mt-3">Feedback: {request.adminfeedback}</p>}
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
