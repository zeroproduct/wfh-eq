import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import SelectInput from 'ink-select-input';
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz';
import { isWithinInterval } from 'date-fns';

const timeZones = [
	{ label: 'America/New_York', value: 'America/New_York', shorthand: 'EST/EDT' },
	{ label: 'America/Chicago', value: 'America/Chicago', shorthand: 'CST/CDT' },
	{ label: 'America/Denver', value: 'America/Denver', shorthand: 'MST/MDT' },
	{ label: 'America/Los_Angeles', value: 'America/Los_Angeles', shorthand: 'PST/PDT' },
	{ label: 'America/Anchorage', value: 'America/Anchorage', shorthand: 'AKST/AKDT' },
	{ label: 'America/Phoenix', value: 'America/Phoenix', shorthand: 'MST' },
	{ label: 'America/Sao_Paulo', value: 'America/Sao_Paulo', shorthand: 'BRT' },
	{ label: 'Europe/London', value: 'Europe/London', shorthand: 'GMT/BST' },
	{ label: 'Europe/Paris', value: 'Europe/Paris', shorthand: 'CET/CEST' },
	{ label: 'Europe/Berlin', value: 'Europe/Berlin', shorthand: 'CET/CEST' },
	{ label: 'Europe/Moscow', value: 'Europe/Moscow', shorthand: 'MSK' },
	{ label: 'Africa/Johannesburg', value: 'Africa/Johannesburg', shorthand: 'SAST' },
	{ label: 'Asia/Dubai', value: 'Asia/Dubai', shorthand: 'GST' },
	{ label: 'Asia/Kolkata', value: 'Asia/Kolkata', shorthand: 'IST' },
	{ label: 'Asia/Bangkok', value: 'Asia/Bangkok', shorthand: 'ICT' },
	{ label: 'Asia/Singapore', value: 'Asia/Singapore', shorthand: 'SGT' },
	{ label: 'Asia/Tokyo', value: 'Asia/Tokyo', shorthand: 'JST' },
	{ label: 'Asia/Shanghai', value: 'Asia/Shanghai', shorthand: 'CST' },
	{ label: 'Asia/Seoul', value: 'Asia/Seoul', shorthand: 'KST' },
	{ label: 'Australia/Sydney', value: 'Australia/Sydney', shorthand: 'AEST/AEDT' },
	{ label: 'Pacific/Auckland', value: 'Pacific/Auckland', shorthand: 'NZST/NZDT' },
];

const WORK_HOURS = {
	start: 9, // 9 AM
	end: 17, // 5 PM
};

const selectInputItems = timeZones.map(tz => ({
	label: `${tz.label} (${tz.shorthand})`,
	value: tz.value
}));

const TimeBlock = ({ isWorkingHour, isOverlap }) => {
	let color = 'gray';
	let char = '██ ';
	if (isWorkingHour && isOverlap) {
		color = 'green';
		char = '██ ';
	} else if (isWorkingHour) {
		color = 'blue';
		char = '██ ';
	}
	return <Text color={color}>{char}</Text>;
};

const getTzShorthand = (tzValue) => {
	const tz = timeZones.find(tz => tz.value === tzValue);
	return tz ? tz.shorthand : '';
};

const TimeRow = ({ timezone, workingHours, overlapHours, hourLabels }) => {
	return (
		<Box>
			<Box width={20}>
				<Text>{timezone}</Text>
			</Box>
			<Box>
				{hourLabels.map((label, idx) => (
					<TimeBlock
						key={idx}
						isWorkingHour={workingHours.includes(idx)}
						isOverlap={overlapHours.includes(idx)}
						label={label}
					/>
				))}
			</Box>
		</Box>
	);
};

const getOverlapHours = (tzA, tzB) => {
	const today = new Date();
	const baseDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
	const getDateInTzA = (hour) =>
		zonedTimeToUtc(`${baseDate}T${String(hour).padStart(2, '0')}:00:00`, tzA);
	const overlapA = [];
	const overlapB = [];
	for (let hour = 0; hour < 24; hour++) {
		// Hour in tzA
		const dateA = getDateInTzA(hour);
		const hourInB = parseInt(formatInTimeZone(dateA, tzB, 'H'));
		const isAWork = isWithinInterval(hour, { start: WORK_HOURS.start, end: WORK_HOURS.end - 1 });
		const isBWork = isWithinInterval(hourInB, { start: WORK_HOURS.start, end: WORK_HOURS.end - 1 });
		if (isAWork && isBWork) overlapA.push(hour);
	}
	for (let hour = 0; hour < 24; hour++) {
		// Hour in tzB
		const dateB = getDateInTzA(hour); // intentionally use tzA as base for mapping
		const hourInA = parseInt(formatInTimeZone(dateB, tzA, 'H'));
		const isBWork = isWithinInterval(hour, { start: WORK_HOURS.start, end: WORK_HOURS.end - 1 });
		const isAWork = isWithinInterval(hourInA, { start: WORK_HOURS.start, end: WORK_HOURS.end - 1 });
		if (isBWork && isAWork) overlapB.push(hour);
	}
	return { overlapA, overlapB };
};

const HourLabelRow = ({hourLabels}) => (
	<Box>
		<Box width={20} />
		<Box>
			{hourLabels.map((label, idx) => (
				<Text key={idx} dimColor>{label.padStart(2, '0')} </Text>
			))}
		</Box>
	</Box>
);

const SelectItem = ({ label, isSelected }) => (
	<Text color={isSelected ? 'blue' : undefined}>{label}</Text>
);

export default function App() {
	const [step, setStep] = useState('selectFirst');
	const [firstTimezone, setFirstTimezone] = useState(null);
	const [secondTimezone, setSecondTimezone] = useState(null);
	const [firstWorkingHours, setFirstWorkingHours] = useState([]);
	const [secondWorkingHours, setSecondWorkingHours] = useState([]);
	const [firstOverlap, setFirstOverlap] = useState([]);
	const [secondOverlap, setSecondOverlap] = useState([]);
	const [secondHourLabels, setSecondHourLabels] = useState([]);

	useEffect(() => {
		if (firstTimezone && secondTimezone) {
			const firstHours = Array.from({ length: 24 }, (_, i) => i);
			const today = new Date();
			const baseDate = today.toISOString().slice(0, 10); // YYYY-MM-DD

			const getDateInFirstTz = (hour) =>
				zonedTimeToUtc(`${baseDate}T${String(hour).padStart(2, '0')}:00:00`, firstTimezone);

			setFirstWorkingHours(
				firstHours.filter(h => h >= WORK_HOURS.start && h < WORK_HOURS.end),
			);
			const overlapA = [];
			for (let hour = 0; hour < 24; hour++) {
				const dateA = getDateInFirstTz(hour);
				const hourInB = parseInt(formatInTimeZone(dateA, secondTimezone, 'H'));
				const isAWork = isWithinInterval(hour, { start: WORK_HOURS.start, end: WORK_HOURS.end - 1 });
				const isBWork = isWithinInterval(hourInB, { start: WORK_HOURS.start, end: WORK_HOURS.end - 1 });
				if (isAWork && isBWork) overlapA.push(hour);
			}
			setFirstOverlap(overlapA);

			const labels = firstHours.map(hour => {
				const dateA = getDateInFirstTz(hour);
				return formatInTimeZone(dateA, secondTimezone, 'HH');
			});
			setSecondHourLabels(labels);

			const secondWorking = firstHours
				.map(hour => {
					const dateA = getDateInFirstTz(hour);
					const hourInB = parseInt(formatInTimeZone(dateA, secondTimezone, 'H'));
					return hourInB >= WORK_HOURS.start && hourInB < WORK_HOURS.end
						? hour
						: null;
				})
				.filter(h => h !== null);
			setSecondWorkingHours(secondWorking);

			const overlap = firstHours.filter(hour => {
				const dateA = getDateInFirstTz(hour);
				const hourInB = parseInt(formatInTimeZone(dateA, secondTimezone, 'H'));
				return (hour >= WORK_HOURS.start && hour < WORK_HOURS.end) &&
					(hourInB >= WORK_HOURS.start && hourInB < WORK_HOURS.end);
			});
			setSecondOverlap(overlap);
		}
	}, [firstTimezone, secondTimezone]);

	const handleSelect = item => {
		if (step === 'selectFirst') {
			setFirstTimezone(item.value);
			setStep('selectSecond');
		} else {
			setSecondTimezone(item.value);
			setStep('showOverlap');
		}
	};

	if (step === 'selectFirst') {
		return (
			<Box flexDirection="column">
				<Text>Select your timezone:</Text>
				<Box marginBottom={1}>
					<Text>

					</Text>
				</Box>
				<SelectInput
					items={selectInputItems}
					itemComponent={SelectItem}
					onSelect={handleSelect}
				/>
			</Box>
		);
	}

	if (step === 'selectSecond') {
		return (
			<Box flexDirection="column">
				<Text>Select the other timezone:</Text>
				<Box marginBottom={1}>
					<Text>
						<Text>{selectInputItems.find(i => i.value === firstTimezone)?.label}</Text>
					</Text>
				</Box>
				<SelectInput 
					items={selectInputItems} 
					itemComponent={SelectItem}
					onSelect={handleSelect} 
				/>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Box marginBottom={1}>
				<Text>Legend: </Text>
				<Text color="blue">█</Text>
				<Text> Working Hours </Text>
				<Text color="green">█</Text>
				<Text> Overlap </Text>
				<Text color="gray">█</Text>
				<Text> Non-working Hours</Text>
			</Box>
			<HourLabelRow hourLabels={Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))} />
			<TimeRow
				timezone={firstTimezone}
				workingHours={firstWorkingHours}
				overlapHours={firstOverlap}
				hourLabels={Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))}
			/>
			<TimeRow
				timezone={secondTimezone}
				workingHours={secondWorkingHours}
				overlapHours={secondOverlap}
				hourLabels={secondHourLabels}
			/>
			<HourLabelRow hourLabels={secondHourLabels} />
		</Box>
	);
}
