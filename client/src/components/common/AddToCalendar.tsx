'use client';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CalendarEvent {
    title: string;
    date: string;
    durationMinutes?: number;
    location?: string;
    description?: string;
}

/* ── ICS generation ────────────────────────── */

function formatICSDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function generateICS(event: CalendarEvent): string {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60_000);

    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//AtlasCaucasus//Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${formatICSDate(start)}`,
        `DTEND:${formatICSDate(end)}`,
        `SUMMARY:${escapeICS(event.title)}`,
    ];

    if (event.location) {
        lines.push(`LOCATION:${escapeICS(event.location)}`);
    }
    if (event.description) {
        lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }

    lines.push(
        `UID:${crypto.randomUUID()}@atlascaucasus.com`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        'END:VEVENT',
        'END:VCALENDAR',
    );

    return lines.join('\r\n');
}

function escapeICS(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function downloadICS(event: CalendarEvent): void {
    const ics = generateICS(event);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/* ── Google Calendar URL ───────────────────── */

function buildGoogleCalendarURL(event: CalendarEvent): string {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60_000);

    const fmt = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${fmt(start)}/${fmt(end)}`,
    });

    if (event.location) params.set('location', event.location);
    if (event.description) params.set('details', event.description);

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ── Outlook Web URL ───────────────────────── */

function buildOutlookURL(event: CalendarEvent): string {
    const start = new Date(event.date);
    const end = new Date(start.getTime() + (event.durationMinutes ?? 60) * 60_000);

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: event.title,
        startdt: start.toISOString(),
        enddt: end.toISOString(),
    });

    if (event.location) params.set('location', event.location);
    if (event.description) params.set('body', event.description);

    return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/* ── Component ─────────────────────────────── */

interface AddToCalendarProps {
    event: CalendarEvent;
}

export function AddToCalendar({ event }: AddToCalendarProps): React.ReactNode {
    const { t } = useTranslation();

    const handleDownloadICS = useCallback((): void => {
        downloadICS(event);
    }, [event]);

    const handleGoogleCalendar = useCallback((): void => {
        window.open(buildGoogleCalendarURL(event), '_blank', 'noopener,noreferrer');
    }, [event]);

    const handleOutlookCalendar = useCallback((): void => {
        window.open(buildOutlookURL(event), '_blank', 'noopener,noreferrer');
    }, [event]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                    <CalendarPlus className="h-3.5 w-3.5" />
                    {t('bookings.add_to_calendar', 'Add to Calendar')}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleGoogleCalendar}>
                    {t('bookings.google_calendar', 'Google Calendar')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOutlookCalendar}>
                    {t('bookings.outlook_calendar', 'Outlook Calendar')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadICS}>
                    {t('bookings.download_ics', 'Download .ics file')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
