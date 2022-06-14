/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useTags, ZIMBRA_STANDARD_COLORS, runSearch } from '@zextras/carbonio-shell-ui';
import {
	AccordionItem,
	Dropdown,
	Row,
	Icon,
	Padding,
	Tooltip,
	ModalManagerContext
} from '@zextras/carbonio-design-system';
import { reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { createTag, useGetTagsActions } from '../ui-actions/tag-actions';
import { ItemType, TagsAccordionItems } from '../views/sidebar/parts/tags/types';

type ItemProps = {
	item: ItemType;
};

const CustomComp: FC<ItemProps> = (props) => {
	const [t] = useTranslation();
	const actions = useGetTagsActions({ tag: props?.item, t });

	const triggerSearch = useCallback(
		() =>
			runSearch(
				[
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						avatarBackground: ZIMBRA_STANDARD_COLORS[props?.item?.color || 0].hex,
						avatarIcon: 'Tag',
						background: 'gray2',
						hasAvatar: true,
						isGeneric: false,
						isQueryFilter: true,
						label: `tag:${props?.item?.name}`,
						value: `tag:"${props?.item?.name}"`
					}
				],
				'mails'
			),
		[props?.item?.color, props?.item?.name]
	);

	return (
		<Dropdown contextMenu items={actions} display="block" width="fit" onClick={triggerSearch}>
			<Row mainAlignment="flex-start" height="fit" padding={{ left: 'large' }} takeAvailableSpace>
				<Icon
					size="large"
					icon="Tag"
					customColor={ZIMBRA_STANDARD_COLORS[props?.item?.color ?? 0].hex}
				/>

				<Padding right="large" />
				<Tooltip label={props?.item?.name} placement="right" maxWidth="100%">
					<AccordionItem {...props} height={40} />
				</Tooltip>
			</Row>
		</Dropdown>
	);
};

export const TagLabel: FC<ItemType> = (props) => {
	const createModal = useContext(ModalManagerContext) as () => () => void;
	const [t] = useTranslation();
	return (
		<Dropdown contextMenu display="block" width="fit" items={[createTag({ t, createModal })]}>
			<Row mainAlignment="flex-start" padding={{ horizontal: 'large' }} takeAvailableSpace>
				<Icon size="large" icon="TagsMoreOutline" /> <Padding right="large" />
				<AccordionItem {...props} height={40} />
			</Row>
		</Dropdown>
	);
};

const useGetTagsAccordion = (): TagsAccordionItems => {
	const tagsFromStore = useTags();
	const [t] = useTranslation();

	return useMemo(
		() => ({
			id: 'Tags',
			label: t('label.tags', 'Tags'),
			divider: true,
			active: false,
			open: false,
			onClick: (e: Event): void => {
				e.stopPropagation();
			},
			CustomComponent: TagLabel,
			items: reduce(
				tagsFromStore,
				(acc: Array<ItemType>, v) => {
					const item = {
						id: v.id,
						active: false,
						color: v.color || 0,
						divider: false,
						label: v.name,
						name: v.name,
						open: false,
						CustomComponent: CustomComp
					};
					acc.push(item);
					return acc;
				},
				[]
			)
		}),
		[t, tagsFromStore]
	);
};

export default useGetTagsAccordion;
