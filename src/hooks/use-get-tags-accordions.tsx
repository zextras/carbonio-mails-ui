/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useMemo } from 'react';
import { useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import {
	AccordionItem,
	Dropdown,
	Row,
	Icon,
	Padding,
	Tooltip
} from '@zextras/carbonio-design-system';
import { reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useGetTagsActions } from '../ui-actions/tag-actions';

type ItemType = {
	CustomComponent: ReactElement | any;
	active: boolean;
	color: number;
	divider: boolean;
	id: string;
	label: string;
	name: string;
	open: boolean;
	actions?: Array<unknown>;
};
type ItemProps = {
	item: ItemType;
};

const CustomComp = (props: ItemProps): ReactElement => {
	const [t] = useTranslation();
	const actions = useGetTagsActions({ tag: props?.item, t });

	return (
		<Dropdown contextMenu items={actions} display="block" width="fit">
			<Row mainAlignment="flex-start" height="fit" padding={{ left: 'large' }} takeAvailableSpace>
				<Icon
					size="large"
					icon="Tag"
					customColor={ZIMBRA_STANDARD_COLORS[props?.item?.color].hex}
				/>
				<Padding right="large" />
				<Tooltip label={props?.item?.name} placement="right" maxWidth="100%">
					<AccordionItem {...props} height={40} />
				</Tooltip>
			</Row>
		</Dropdown>
	);
};
const useGetTagsAccordion = (): ItemType[] => {
	const tagsFromStore = useTags();
	return useMemo(
		() =>
			reduce(
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
			),
		[tagsFromStore]
	);
};

export default useGetTagsAccordion;
