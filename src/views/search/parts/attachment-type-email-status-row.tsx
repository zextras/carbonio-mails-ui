/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

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

const AttachmentTypeEmailStatusRow: FC<AttachTypeEmailStatusRowPropType> = ({
	compProps
}): ReactElement => {
	const { attachmentType, setAttachmentType, emailStatus, setEmailStatus } = compProps;
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
    const onChange = useCallback((state: ChipItem[], stateHandler: (state: ChipItem[]) => void) => {
		stateHandler(state);
	}, []);

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

	const attachmentTypeOnChange = useCallback(
		(value: ChipItem[]): void => onChange(value, setAttachmentType),
		[setAttachmentType]
	);

	const emailStatusOnChange = useCallback(
		(value: ChipItem[]): void => onChange(value, setEmailStatus),
		[setEmailStatus]
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
				<ChipInput
					disabled
					placeholder={attachmentTypePlaceholder}
					value={attachmentType}
					options={attachmentTypeOptions}
					disableOptions={false}
					background="gray5"
					onAdd={attachmentTypeChipOnAdd}
					onChange={attachmentTypeOnChange}
					icon="ChevronDown"
					requireUniqueChips
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<ChipInput
					disabled
					placeholder={emailStatusPlaceholder}
					value={emailStatus}
					options={emailStatusOptions}
					background="gray5"
					disableOptions={false}
					onAdd={emailStatusChipOnAdd}
					onChange={emailStatusOnChange}
					icon="ChevronDown"
					bottomBorderColor="transparent"
					requireUniqueChips
				/>
			</Container>
		</Container>
	);
};

export default AttachmentTypeEmailStatusRow;
