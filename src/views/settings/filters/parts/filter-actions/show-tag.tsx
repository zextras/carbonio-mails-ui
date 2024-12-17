/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { ChipInput, ChipItem, DropdownItem, Row } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { ZIMBRA_STANDARD_COLORS } from '../../../../../carbonio-ui-commons/constants';

type Tag = {
	label: string;
	customComponent?: React.ReactNode;
	color?: number;
};

type ShowTagProps = {
	value: Tag[];
	tagOptions: Tag[] | undefined;
	onTagChange: (chip: Tag[]) => void;
};

export const ShowTag = ({ value, tagOptions, onTagChange }: ShowTagProps): React.JSX.Element => {
	const [t] = useTranslation();

	const tagChipInput = value.map(
		(tag): ChipItem<Tag> => ({
			label: tag.label,
			value: tag,
			avatarBackground: ZIMBRA_STANDARD_COLORS[tag.color ?? 0].hex,
			hasAvatar: true,
			avatarIcon: 'Tag'
		})
	);

	const tagChipOptions = tagOptions?.map(
		(
			tag
		): DropdownItem & {
			value?: Tag;
		} => ({
			id: tag.label,
			label: tag.label,
			value: tag,
			customComponent: tag.customComponent
		})
	);
	const tagChipOnAdd = useCallback((tagValue: unknown): ChipItem<Tag> => {
		const tag = tagValue as Tag;
		return {
			label: tag.label,
			value: tag,
			avatarBackground: ZIMBRA_STANDARD_COLORS[tag.color ?? 0].hex,
			hasAvatar: true,
			avatarIcon: 'Tag'
		};
	}, []);

	const onTagInternalChange = useCallback(
		(chips: ChipItem<Tag>[]) => {
			const chipsValue = chips.map((chip) => chip.value) as Tag[];
			onTagChange(chipsValue);
		},
		[onTagChange]
	);

	return (
		<Row padding={{ right: 'small' }} minWidth="12.5rem">
			<ChipInput
				placeholder={t('label.tag', 'Tag')}
				background="gray4"
				defaultValue={[]}
				options={tagChipOptions}
				value={tagChipInput}
				singleSelection
				onChange={onTagInternalChange}
				onAdd={tagChipOnAdd}
				disableOptions={false}
				disabled
			/>
		</Row>
	);
};
