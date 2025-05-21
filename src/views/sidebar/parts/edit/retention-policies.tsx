/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
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

import { RetentionPolicyState } from '../../commons/types';

type RetentionPoliciesProps = {
	retentionState: RetentionPolicyState;
	setRetentionState: (state: Partial<RetentionPolicyState>) => void;
};

export const RetentionPolicies: FC<RetentionPoliciesProps> = ({
	retentionState,
	setRetentionState
}) => {
	const [t] = useTranslation();

	const retentionPeriod = [
		{ label: t('label.days', 'Days'), value: 'd' },
		{ label: t('label.weeks', 'Weeks'), value: 'w' },
		{ label: t('label.months', 'Months'), value: 'm' },
		{ label: t('label.years', 'Years'), value: 'y' }
	];

	const {
		showPolicy = false,
		dsblMsgDis = false,
		emptyDisValue = false,
		purgeValue = 0,
		dspYear = 'd',
		dspRange = ''
	} = retentionState || {};

	const handleDisposalToggle = (): void => {
		if (emptyDisValue) setRetentionState({ emptyDisValue: false });
		setRetentionState({ dsblMsgDis: !dsblMsgDis });
	};

	const handleThresholdChange = (e: ChangeEvent<HTMLInputElement>): void => {
		if (emptyDisValue) setRetentionState({ emptyDisValue: false });
		setRetentionState({ purgeValue: e.target.value });
	};

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
					onClick={(): void => setRetentionState({ showPolicy: !showPolicy })}
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
							{emptyDisValue && (
								<Padding all="small">
									<Text size="small" color="error">
										{t(
											'folder.modal.edit.retention_duration_warning',
											'The retention duration must be a positive number'
										)}
									</Text>
								</Padding>
							)}
						</Row>
						<Row orientation="vertical" width="48%" crossAlignment="flex-start">
							<Select
								disabled={!dsblMsgDis}
								items={retentionPeriod}
								background="gray5"
								label={t('label.select', 'Select')}
								disablePortal
								onChange={(val): void => {
									const selected = retentionPeriod.find((item) => item.value === val);
									setRetentionState({
										dspYear: val ?? null,
										dspRange: selected?.label ?? ''
									});
								}}
								selection={{ value: dspYear, label: dspRange }}
							/>
						</Row>
					</Row>
				</Container>
			</Collapse>
		</>
	);
};
