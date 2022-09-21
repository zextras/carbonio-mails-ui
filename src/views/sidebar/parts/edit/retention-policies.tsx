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
	IconButton,
	Collapse,
	Input,
	Select
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { RetentionPoliciesProps } from '../../../../types/sidebar';

const RetentionPolicies: FC<RetentionPoliciesProps> = ({
	showPolicy,
	setShowPolicy,
	emptyRtnValue,
	setEmptyRtnValue,
	dsblMsgRet,
	setDsblMsgRet,
	rtnValue,
	setRtnValue,
	retentionPeriod,
	rtnYear,
	setRtnYear,
	dsblMsgDis,
	setDsblMsgDis,
	emptyDisValue,
	setEmptyDisValue,
	purgeValue,
	setPurgeValue,
	dspYear,
	setDspYear,
	rtnRange,
	dspRange
}) => (
	<>
		<Row orientation="horizontal" mainAlignment="space-between" takeAvailableSpace width="100%">
			<Text weight="bold" size="large">
				{t('label.retention_policy', 'Retention policy')}
			</Text>

			<IconButton
				size="medium"
				style={{ padding: 0, margin: 0 }}
				onClick={(): void => setShowPolicy(!showPolicy)}
				icon={showPolicy ? 'ChevronUpOutline' : 'ChevronDownOutline'}
			/>
		</Row>
		<Collapse orientation="vertical" open={showPolicy}>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" padding={{ top: 'medium' }}>
				<Checkbox
					value={dsblMsgRet}
					onClick={(): void => {
						emptyRtnValue && setEmptyRtnValue(false);
						setDsblMsgRet(!dsblMsgRet);
					}}
					label={t('label.enable_message_retention', 'Enable Message Retention')}
				/>
				<Container padding={{ all: 'small' }}>
					<Text overflow="break-word">
						{t(
							'folder.modal.edit.retention_message',
							'Messages in this folder which fall within the retention range will require explicit confirmation before being deleted'
						)}
					</Text>
				</Container>
				<Row
					mainAlignment="space-between"
					padding={{ vertical: 'small', horizontal: 'medium' }}
					crossAlignment="flex-start"
					takeAvailableSpace
					width="100%"
					orientation="horizontal"
				>
					<Row orientation="vertical" width="48%" crossAlignment="flex-start">
						<Input
							disabled={!dsblMsgRet}
							onChange={(e: ChangeEvent<HTMLInputElement>): void => {
								emptyRtnValue && setEmptyRtnValue(false);
								setRtnValue(e.target.value);
							}}
							label={t('label.retention_range', 'Retention Range')}
							value={rtnValue === 0 ? '' : rtnValue}
						/>
						{emptyRtnValue && (
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
						{rtnRange && rtnYear && (
							<Select
								disabled={!dsblMsgRet}
								items={retentionPeriod}
								background="gray5"
								label={t('label.select', 'Select')}
								disablePortal
								multiple={false}
								// TS doesn't get the correct overload
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								onChange={setRtnYear}
								defaultSelection={{ label: rtnRange, value: rtnYear }}
							/>
						)}
					</Row>
				</Row>
				<Padding top="small" />
				<Container mainAlignment="flex-start" crossAlignment="flex-start">
					<Checkbox
						value={dsblMsgDis}
						onClick={(): void => {
							emptyDisValue && setEmptyDisValue(false);
							setDsblMsgDis(!dsblMsgDis);
						}}
						label={t('label.enable_message_disposal', 'Enable Message Disposal')}
					/>
					<Container padding={{ all: 'small' }}>
						<Text overflow="break-word">
							{t(
								'folder.modal.edit.threshold_message',
								'Messages in this folder which are older than the disposal threshold will be subject to automated cleanup and deletion.'
							)}
						</Text>
					</Container>
					<Row
						mainAlignment="space-between"
						padding={{ vertical: 'small', horizontal: 'medium' }}
						crossAlignment="flex-start"
						takeAvailableSpace
						width="100%"
						orientation="horizontal"
					>
						<Row orientation="vertical" width="48%" crossAlignment="flex-start">
							<Input
								label={t('label.disposal_threshold', 'Disposal Threshold')}
								onChange={(e: ChangeEvent<HTMLInputElement>): void => {
									emptyDisValue && setEmptyDisValue(false);
									setPurgeValue(e.target.value);
								}}
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
							{dspRange && dspYear && (
								<Select
									disabled={!dsblMsgDis}
									items={retentionPeriod}
									background="gray5"
									label={t('label.select', 'Select')}
									disablePortal
									// TS doesn't get the correct overload
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									onChange={setDspYear}
									defaultSelection={{ value: dspYear, label: dspRange }}
								/>
							)}
						</Row>
					</Row>
				</Container>
			</Container>
		</Collapse>
	</>
);

export default RetentionPolicies;
