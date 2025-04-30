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

	const chipOnAdd = useCallback(
		({ items, label, preText, hasAvatar, isGeneric, isQueryFilter }: ChipOnAddProps): ChipOnAdd => {
			const values = items.filter((item: ChipOnAddItem) => item.label === label)[0];
			return {
				label: `${preText}:${label}`,
				hasAvatar,
				isGeneric,
				isQueryFilter,
				value: values.searchString,
				avatarIcon: values.icon ?? 'Tag',
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
		(value: ChipItem[]): void => setAttachmentType(value),
		[setAttachmentType]
	);

	const emailStatusOnChange = useCallback(
		(value: ChipItem[]): void => setEmailStatus(value),
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
	const attachmentIcon = 'ChevronDown';
	const emailStatusIcon = 'ChevronDown';
	const attachmentTypeBottomBorderColor = 'transparent';
	const emailStatusBottomBorderColor = 'transparent';

	return (
		<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
			<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
				<ChipInput
					placeholder={attachmentTypePlaceholder}
					value={attachmentType}
					options={attachmentTypeOptions}
					background="gray5"
					disableOptions={false}
					onAdd={attachmentTypeChipOnAdd}
					onChange={attachmentTypeOnChange}
					maxChips={1}
					confirmChipOnBlur
					icon={attachmentIcon}
					bottomBorderColor={attachmentTypeBottomBorderColor}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<ChipInput
					dropdownMaxHeight="40%"
					confirmChipOnBlur
					placeholder={emailStatusPlaceholder}
					value={emailStatus}
					options={emailStatusOptions}
					background="gray5"
					disableOptions={false}
					onAdd={emailStatusChipOnAdd}
					onChange={emailStatusOnChange}
					icon={emailStatusIcon}
					bottomBorderColor={emailStatusBottomBorderColor}
					maxHeight="40%"
				/>
			</Container>
		</Container>
	);
};

export default AttachmentTypeEmailStatusRow;
