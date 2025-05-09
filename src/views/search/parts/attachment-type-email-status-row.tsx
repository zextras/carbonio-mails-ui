/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';

import {
	attachmentTypeItemsConstant,
	AttachmentTypeItemsConstantProps,
	emailStatusItemsConstant,
	EmailStatusItemsConstantProps
} from '../../../constants';
import type {
	AttachTypeEmailStatusRowPropType,
	ChipOnAdd,
	ChipOnAddItem,
	ChipOnAddProps
} from '../../../types';

export const AttachmentTypeEmailStatusRow: FC<AttachTypeEmailStatusRowPropType> = ({
	query,
	attachmentTypeInputName,
	emailStatusInputName
}): ReactElement => {
	const { control } = useFormContext();
	const attachmentTypeInQuery = map(
		filter(query, (v) => /^Attachment:/.test(v.label)),
		(q) => ({ ...q })
	);
	const emailStatusInQuery = map(
		filter(query, (v) => /^Is:/.test(v.label)),
		(q) => ({ ...q })
	);
	const attachmentTypeItems = attachmentTypeItemsConstant(t);
	const emailStatusItems = emailStatusItemsConstant(t);
	const attachmentTypeOptions = useMemo<AttachmentTypeItemsConstantProps[]>(
		() => attachmentTypeItems,
		[attachmentTypeItems]
	);
	const emailStatusOptions = useMemo<EmailStatusItemsConstantProps[]>(
		() => emailStatusItems,
		[emailStatusItems]
	);

	const chipOnAdd = useCallback(
		({ items, label, preText, hasAvatar, isGeneric, isQueryFilter }: ChipOnAddProps): ChipOnAdd => {
			const value = items.filter((item: ChipOnAddItem) => item.label === label)[0];
			return {
				label: `${preText}:${label}`,
				hasAvatar,
				isGeneric,
				isQueryFilter,
				value: value.searchString,
				avatarIcon: value.icon ?? 'Tag',
				avatarColor: 'gray6'
			};
		},
		[]
	);

	const attachmentTypeChipOnAdd = useCallback(
		(label: unknown): ChipOnAdd =>
			chipOnAdd({
				items: attachmentTypeItems,
				label: label as string,
				preText: 'Attachment',
				hasAvatar: true,
				isGeneric: true,
				isQueryFilter: true
			}),
		[chipOnAdd, attachmentTypeItems]
	);

	const emailStatusChipOnAdd = useCallback(
		(label: unknown): ChipOnAdd =>
			chipOnAdd({
				items: emailStatusItems,
				label: label as string,
				preText: 'Is',
				hasAvatar: false,
				isGeneric: true,
				isQueryFilter: true
			}),
		[chipOnAdd, emailStatusItems]
	);

	const attachmentTypePlaceholder = useMemo(
		() => t('label.attachment_type', 'Attachment type'),
		[]
	);

	const emailStatusPlaceholder = useMemo(
		() => t('label.attachment_status', 'Status of e-mail item'),
		[]
	);

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					defaultValue={attachmentTypeInQuery}
					name={attachmentTypeInputName}
					render={({ field: { onChange, value } }) => (
						<ChipInput
							disabled
							placeholder={attachmentTypePlaceholder}
							value={value}
							options={attachmentTypeOptions}
							disableOptions={false}
							background="gray5"
							onAdd={attachmentTypeChipOnAdd}
							onChange={onChange}
							icon="ChevronDown"
							requireUniqueChips
							data-testid="attachmentTypeSelect"
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					defaultValue={emailStatusInQuery}
					name={emailStatusInputName}
					render={({ field: { onChange, value } }) => (
						<ChipInput
							disabled
							placeholder={emailStatusPlaceholder}
							value={value}
							options={emailStatusOptions}
							background="gray5"
							disableOptions={false}
							onAdd={emailStatusChipOnAdd}
							onChange={onChange}
							icon="ChevronDown"
							bottomBorderColor="transparent"
							requireUniqueChips
							data-testid="emailStatusSelect"
						/>
					)}
				/>
			</Container>
		</Container>
	);
};
