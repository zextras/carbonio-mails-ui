/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Controller } from 'react-hook-form';

import {
	attachmentTypeItemsConstant,
	AttachmentTypeItemsConstantProps,
	emailStatusItemsConstant,
	EmailStatusItemsConstantProps
} from 'constants/index';
import { ChipOnAdd, ChipOnAddItem, ChipOnAddProps } from 'types/search';
import { FormValuesControlProps, KeywordState } from 'views/search/types/types';

export const AttachmentTypeEmailStatusRow = ({
	control
}: FormValuesControlProps): React.JSX.Element => {
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

	const attachmentPrefix = 'Attachment';
	const emailStatusPrefix = 'Is';

	const attachmentTypeChipOnAdd = useCallback(
		(label: string, values: KeywordState): ChipOnAdd | undefined => {
			const alreadyExists = values.some((item) => item.label === `${attachmentPrefix}:${label}`);
			if (alreadyExists) {
				return undefined;
			}
			return chipOnAdd({
				items: attachmentTypeItems,
				label,
				preText: attachmentPrefix,
				hasAvatar: true,
				isGeneric: true,
				isQueryFilter: true
			});
		},
		[chipOnAdd, attachmentTypeItems]
	);

	const emailStatusChipOnAdd = useCallback(
		(label: string, values: KeywordState): ChipOnAdd | undefined => {
			const alreadyExists = values.some((item) => item.label === `${emailStatusPrefix}:${label}`);
			if (alreadyExists) {
				return undefined;
			}
			return chipOnAdd({
				items: emailStatusItems,
				label,
				preText: emailStatusPrefix,
				hasAvatar: false,
				isGeneric: true,
				isQueryFilter: true
			});
		},
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
					name={'attachmentType'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
						<ChipInput
							disabled
							placeholder={attachmentTypePlaceholder}
							value={value}
							options={attachmentTypeOptions}
							disableOptions={false}
							background="gray5"
							onAdd={(label): any => {
								if (typeof label !== 'string') {
									return undefined;
								}
								// fix typings on DS
								return attachmentTypeChipOnAdd(label, value) as any;
							}}
							onChange={(chips): void => {
								const validChips = chips.filter((chip) => chip !== undefined);
								onChange(validChips);
							}}
							icon="ChevronDown"
							data-testid="attachmentTypeSelect"
						/>
					)}
				/>
			</Container>
			<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
				<Controller
					control={control}
					name={'emailStatus'}
					render={({ field: { onChange, value } }): React.JSX.Element => (
						<ChipInput
							disabled
							placeholder={emailStatusPlaceholder}
							value={value}
							options={emailStatusOptions}
							background="gray5"
							disableOptions={false}
							onAdd={(label): any => {
								if (typeof label !== 'string') {
									return undefined;
								}
								// fix typings on DS
								return emailStatusChipOnAdd(label, value) as any;
							}}
							onChange={(chips): void => {
								const validChips = chips.filter((chip) => chip !== undefined);
								onChange(validChips);
							}}
							icon="ChevronDown"
							bottomBorderColor="transparent"
							data-testid="emailStatusSelect"
						/>
					)}
				/>
			</Container>
		</Container>
	);
};
