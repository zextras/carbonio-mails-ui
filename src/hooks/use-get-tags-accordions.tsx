/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useContext, useMemo } from 'react';
import { getTags, useTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import {
	AccordionItem,
	Dropdown,
	Row,
	Icon,
	Padding,
	Tooltip,
	ModalManagerContext,
	SnackbarManagerContext,
	Text
} from '@zextras/carbonio-design-system';
import { reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { TagsActionsType } from '../types/tags';
import CreateTagModal from '../views/sidebar/parts/tags/create-tag-modal';

type ItemProps = {
	item: {
		CustomComponent: ReactElement;
		active: boolean;
		color: number;
		divider: boolean;
		id: string;
		label: string;
		name: string;
		open: boolean;
		actions: Array<unknown>;
	};
};

const useGetTagsActions = ({ tag, t }: any): Array<any> => {
	const createModal = useContext(ModalManagerContext);
	return [
		{
			id: TagsActionsType.NEW,
			icon: 'TagOutline',
			label: t('label.create_tag', 'Create Tag'),
			click: (e: React.SyntheticEvent<EventTarget>): void => {
				if (e) {
					e.stopPropagation();
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const closeModal = createModal(
					{ children: <CreateTagModal onClose={(): void => closeModal()} /> },
					true
				);
			}
		},
		{
			id: TagsActionsType.EDIT,
			icon: 'Edit2Outline',
			label: t('label.edit_tag', 'Edit Tag'),
			click: (e: React.SyntheticEvent<EventTarget>): void => {
				if (e) {
					e.stopPropagation();
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const closeModal = createModal(
					{ children: <CreateTagModal onClose={(): void => closeModal()} tag={tag} editMode /> },
					true
				);
			}
		},
		{
			id: TagsActionsType.DELETE,
			icon: 'Untag',
			label: t('label.delete_tag', 'Delete Tag'),
			click: (e: React.SyntheticEvent<EventTarget>): void => {
				if (e) {
					e.stopPropagation();
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				const closeModal = createModal({
					title: t('label.delete_tag', { name: tag?.name, defaultValue: 'Delete "{{name}}" tag' }),
					cofirmLabel: t('label.delete', 'Delete'),
					onConfirm: () => {
						closeModal();
					},
					children: (
						<>
							<Text>
								{t('message.delete_tag_message1', {
									name: tag?.name,
									defaultValue: `Are you sure to delete "{{name}}" Tag?`
								})}
							</Text>
							<Text overflow="break-word">
								{t(
									'message.delete_tag_message2',
									'Deleting it will be removed from every item affected by.'
								)}
							</Text>
						</>
					)
				});
			}
		}
	];
};
const CustomComp = (props: ItemProps): ReactElement => {
	const [t] = useTranslation();
	const actions = useGetTagsActions({ tag: props?.item, t });

	console.log('xxx actions:', actions);
	return (
		<Dropdown contextMenu items={actions} display="block" width="100%">
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
const useGetTagsAccordion = (): ItemProps[] => {
	const tagsFromStore = useTags();

	return useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc, v) => {
					const item = {
						id: v.id,
						active: false,
						color: v.color,
						divider: false,
						label: v.name,
						name: v.name,
						open: false,
						CustomComponent: CustomComp
					};
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					acc.push(item);
					return acc;
				},
				[]
			),
		[tagsFromStore]
	);
};

export default useGetTagsAccordion;
