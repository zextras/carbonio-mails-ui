/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, SyntheticEvent, useCallback, useContext, useMemo } from 'react';

import {
	AccordionItem,
	Dropdown,
	Icon,
	ModalManagerContext,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	ZIMBRA_STANDARD_COLORS,
	runSearch,
	t,
	QueryChip,
	getTags
} from '@zextras/carbonio-shell-ui';
import { reduce } from 'lodash';

import type { TagsAccordionItems } from '../carbonio-ui-commons/types/tags';
import type { ItemType } from '../types';
import { createTag, useGetTagsActions } from '../ui-actions/tag-actions';

type ItemProps = {
	item: ItemType;
};

const CustomComp: FC<ItemProps> = (props) => {
	const actions = useGetTagsActions({ tag: props?.item });

	const triggerSearch = useCallback(
		() =>
			runSearch(
				[
					// TODO: add a new type for query chips
					{
						avatarBackground: ZIMBRA_STANDARD_COLORS[props?.item?.color || 0].hex,
						avatarIcon: 'Tag',
						background: 'gray2',
						hasAvatar: true,
						isGeneric: false,
						isQueryFilter: true,
						label: `tag:${props?.item?.name}`,
						value: `tag:"${props?.item?.name}"`
					} as QueryChip
				],
				'mails'
			),
		[props?.item?.color, props?.item?.name]
	);

	return (
		<Dropdown contextMenu items={actions} display="block" width="fit" onClick={triggerSearch}>
			<Row mainAlignment="flex-start" height="fit" padding={{ left: 'large' }} takeAvailableSpace>
				<Icon size="large" icon="Tag" color={ZIMBRA_STANDARD_COLORS[props?.item?.color ?? 0].hex} />

				<Padding right="large" />
				<Tooltip label={props?.item?.name} placement="right" maxWidth="100%">
					<AccordionItem {...props} height="2.5rem" />
				</Tooltip>
			</Row>
		</Dropdown>
	);
};

export const TagLabel: FC<ItemType> = (props) => {
	const createModal = useContext(ModalManagerContext) as () => () => void;
	return (
		<Dropdown contextMenu display="block" width="fit" items={[createTag({ createModal })]}>
			<Row mainAlignment="flex-start" padding={{ horizontal: 'large' }} takeAvailableSpace>
				<Icon size="large" icon="TagsMoreOutline" /> <Padding right="large" />
				<AccordionItem {...{ ...props, color: `${props.color}` }} height="2.5rem" />
			</Row>
		</Dropdown>
	);
};
const tagsFromStore = getTags();

const useGetTagsAccordion = (): TagsAccordionItems =>
	useMemo(
		() => ({
			id: 'Tags',
			label: t('label.tags', 'Tags'),
			active: false,
			open: false,
			onClick: (e: SyntheticEvent<Element, Event> | KeyboardEvent): void => {
				e.stopPropagation();
			},
			CustomComponent: TagLabel,
			items: reduce(
				tagsFromStore,
				(acc: Array<ItemType>, v) => {
					const item = {
						id: v.id,
						item: v,
						active: false,
						color: v.color || 0,
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
		[]
	);

export default useGetTagsAccordion;
