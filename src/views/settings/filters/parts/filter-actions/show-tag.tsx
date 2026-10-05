/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import {
	ChipInput,
	ChipItem,
	DropdownItem,
	Icon,
	Padding,
	Row,
	Text
} from '@zextras/carbonio-design-system';
import { resolveTagColorHex } from '@zextras/carbonio-ui-commons';
import { find } from 'lodash';
import { useTranslation } from 'react-i18next';

import { MailFilterTag } from 'types/filters';

type ShowTagProps = {
	value: MailFilterTag[];
	tagOptions: MailFilterTag[] | undefined;
	onTagChange: (chip: MailFilterTag[]) => void;
};

export const ShowTag = ({
	value,
	tagOptions,
	onTagChange,
	...rest
}: ShowTagProps): React.JSX.Element => {
	const [t] = useTranslation();

	const tagChipOptions = tagOptions?.map(
		(
			tag
		): DropdownItem & {
			value?: MailFilterTag;
		} => {
			const color: string = resolveTagColorHex(tag);
			return {
				id: tag.label,
				label: tag.label,
				value: tag,
				customComponent: (
					<Row data-testid={`tag-option-${tag.label}-${color}`}>
						<Icon icon="Tag" color={color} />
						<Padding left="small">
							<Text>{tag.label}</Text>
						</Padding>
					</Row>
				)
			};
		}
	);
	const tagChipInput = value.map((tag): ChipItem<MailFilterTag> => {
		const tagColor = resolveTagColorHex(
			tag.color !== undefined || tag.rgb
				? tag
				: find(tagOptions, (option) => option.label === tag.label)
		);
		return {
			label: tag.label,
			value: tag,
			// @ts-expect-error ignored just to check color is correct in tests
			'data-testid': `tag-${tag.label}-${tagColor}`,
			avatarBackground: tagColor,
			hasAvatar: true,
			avatarIcon: 'Tag'
		};
	});
	const tagChipOnAdd = useCallback((tagValue: unknown): ChipItem<MailFilterTag> => {
		const tag = tagValue as MailFilterTag;
		return {
			label: tag.label,
			value: tag,
			avatarBackground: resolveTagColorHex(tag),
			hasAvatar: true,
			avatarIcon: 'Tag'
		};
	}, []);

	const onTagInternalChange = useCallback(
		(chips: ChipItem<MailFilterTag>[]) => {
			const chipsValue = chips.map((chip) => chip.value) as MailFilterTag[];
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
				{...rest}
			/>
		</Row>
	);
};
