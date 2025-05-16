/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC } from 'react';

import {
	Container,
	Checkbox,
	Row,
	Padding,
	Text,
	Button,
	Collapse,
	Input,
	Select
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

type RetentionPoliciesProps = {
	showPolicy: boolean;
	setShowPolicy: (val: boolean) => void;
	dsblMsgDis: boolean;
	setDsblMsgDis: (val: boolean) => void;
	emptyDisValue: boolean;
	setEmptyDisValue: (val: boolean) => void;
	purgeValue: number | string;
	setPurgeValue: (val: string) => void;
	retentionPeriod: Array<{ label: string; value: string }>;
	dspYear: string | null;
	setDspYear: (val: string | null) => void;
	dspRange: string;
};

export const RetentionPolicies: FC<RetentionPoliciesProps> = ({
	showPolicy,
	setShowPolicy,
	dsblMsgDis,
	setDsblMsgDis,
	emptyDisValue,
	setEmptyDisValue,
	purgeValue,
	setPurgeValue,
	retentionPeriod,
	dspYear,
	setDspYear,
	dspRange
}) => {
	const [t] = useTranslation();
	const handleDisposalToggle = (): void => {
		if (emptyDisValue) setEmptyDisValue(false);
		setDsblMsgDis(!dsblMsgDis);
	};

	const handleThresholdChange = (e: ChangeEvent<HTMLInputElement>): void => {
		if (emptyDisValue) setEmptyDisValue(false);
		setPurgeValue(e.target.value);
	};

	const renderDisposalWarning = (): false | React.JSX.Element =>
		emptyDisValue && (
			<Padding all="small">
				<Text size="small" color="error">
					{t(
						'folder.modal.edit.retention_duration_warning',
						'The retention duration must be a positive number'
					)}
				</Text>
			</Padding>
		);

	const renderDisposalSelect = (): '' | React.JSX.Element | null =>
		dspRange &&
		dspYear && (
			<Select
				disabled={!dsblMsgDis}
				items={retentionPeriod}
				background="gray5"
				label={t('label.select', 'Select')}
				disablePortal
				onChange={setDspYear}
				defaultSelection={{ value: dspYear, label: dspRange }}
			/>
		);

	return (
		<>
			<Row orientation="horizontal" mainAlignment="space-between" takeAvailableSpace width="100%">
				<Text weight="bold" size="large">
					{t('label.retention_policy', 'Retention policy')}
				</Text>
				<Button
					size="medium"
					type="ghost"
					color="gray0"
					style={{ padding: 0, margin: 0 }}
					onClick={(): void => setShowPolicy(!showPolicy)}
					icon={showPolicy ? 'ChevronUpOutline' : 'ChevronDownOutline'}
					data-testid="retention_policy-icon"
				/>
			</Row>
			<Collapse orientation="vertical" open={showPolicy}>
				<Container
					mainAlignment="flex-start"
					crossAlignment="flex-start"
					padding={{ top: 'medium' }}
				>
					<Checkbox
						value={dsblMsgDis}
						onClick={handleDisposalToggle}
						label={t('label.enable_message_disposal', 'Enable Message Disposal')}
						data-testid="enableMsgDisposal"
					/>

					<Container padding={{ vertical: 'small' }}>
						<Text overflow="break-word">
							{t(
								'folder.modal.edit.threshold_message',
								'Messages in this folder which are older than the disposal threshold will be subject to automated cleanup and deletion.'
							)}
						</Text>
					</Container>

					<Row
						mainAlignment="space-between"
						padding={{ vertical: 'small' }}
						crossAlignment="flex-start"
						takeAvailableSpace
						width="100%"
						orientation="horizontal"
					>
						<Row orientation="vertical" width="48%" crossAlignment="flex-start">
							<Input
								label={t('label.disposal_threshold', 'Disposal Threshold')}
								onChange={handleThresholdChange}
								disabled={!dsblMsgDis}
								value={purgeValue === 0 ? '' : purgeValue}
							/>
							{renderDisposalWarning()}
						</Row>

						<Row orientation="vertical" width="48%" crossAlignment="flex-start">
							{renderDisposalSelect()}
						</Row>
					</Row>
				</Container>
			</Collapse>
		</>
	);
};
