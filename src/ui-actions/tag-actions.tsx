/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { TFunction } from 'i18next';
import {
	ModalManagerContext,
	SnackbarManagerContext,
	Row,
	Text,
	Padding,
	Icon,
	Checkbox
} from '@zextras/carbonio-design-system';

import { every, includes, map, reduce } from 'lodash';
import { ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { TagsActionsType } from '../types/tags';
import CreateUpdateTagModal from '../views/sidebar/parts/tags/create-update-tag-modal';
import DeleteTagModal from '../views/sidebar/parts/tags/delete-tag-modal';
import { convAction } from '../store/actions';

export type ReturnType = {
	id: string;
	icon: string;
	label: string;
	click?: (arg: React.SyntheticEvent<EventTarget>) => void;
	items?: Array<{
		customComponent: ReactElement;
		id: string;
		icon: string;
		label: string;
	}>;
};

export type TagType = {
	CustomComponent: ReactElement;
	active: boolean;
	color: number;
	divider: boolean;
	id: string;
	label: string;
	name: string;
	open: boolean;
};
export type TagFromStoreType = { color: number; id: string; name: string };
export type TagsFromStoreType = Record<string, TagFromStoreType>;

export type ArgumentType = {
	t: TFunction;
	createModal?: unknown;
	createSnackbar?: unknown;
	items?: ReturnType;
	tag?: TagType;
};

export const createTag = ({ t, createModal }: ArgumentType): ReturnType => ({
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
			{ children: <CreateUpdateTagModal onClose={(): void => closeModal()} /> },
			true
		);
	}
});

export const editTag = ({ t, createModal, tag }: ArgumentType): ReturnType => ({
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
			{
				children: <CreateUpdateTagModal onClose={(): void => closeModal()} tag={tag} editMode />
			},
			true
		);
	}
});

export const deleteTag = ({ t, createModal, tag }: ArgumentType): ReturnType => ({
	id: TagsActionsType.DELETE,
	icon: 'Untag',
	label: t('label.delete_tag', 'Delete Tag'),
	click: (e: React.SyntheticEvent<EventTarget>): void => {
		if (e) {
			e.stopPropagation();
		}
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const closeModal = createModal(
			{
				children: <DeleteTagModal onClose={(): void => closeModal()} tag={tag} />
			},
			true
		);
	}
});

export const TagsDropdownItem = ({
	tag,
	conversation
}: {
	tag: { id: string; name: string; color: number };
	conversation: any;
}): ReactElement => {
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const [checked, setChecked] = useState(includes(conversation.tags, tag.name));
	const toggleCheck = useCallback(
		(e) => {
			e.preventDefault();
			setChecked((c) => !c);
			dispatch(
				convAction({
					operation: checked ? 'tag' : '!tag',
					ids: conversation.id,
					tagName: tag.name
				})
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			).then((res: any) => {
				if (res.type.includes('fulfilled')) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `tag`,
						replace: true,
						hideButton: true,
						type: 'info',
						label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 3000
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `tag`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[checked, conversation.id, createSnackbar, dispatch, t, tag.name]
	);
	const tagIcon = useMemo(() => (checked ? 'Untag' : 'TagOutline'), [checked]);
	const tagColor = useMemo(() => ZIMBRA_STANDARD_COLORS[tag.color || 0].hex, [tag.color]);
	return (
		<Row takeAvailableSpace mainAlignment="flex-start">
			<Padding right="small">
				<Checkbox value={checked} onClick={toggleCheck} />
			</Padding>
			<Row takeAvailableSpace mainAlignment="space-between">
				<Padding right="small">
					<Text size="small">{tag.name}</Text>
				</Padding>
				<Icon icon={tagIcon} color={tagColor} />
			</Row>
		</Row>
	);
};

export const MultiSelectTagsDropdownItem = ({
	tag,
	ids,
	tags,
	conversations
}: {
	tag: TagType;
	conversations: any;
	ids: string[];
	tags: TagFromStoreType;
	multiSelect?: boolean;
}): ReactElement => {
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const tagsToShow = reduce(
		tags,
		(acc: any, v: any) => {
			const values = map(conversations, (c) => includes(c.tags, v.name));
			if (every(values)) acc.push(v.name);
			return acc;
		},
		[]
	);

	const [checked, setChecked] = useState(includes(tagsToShow, tag.name));
	const toggleCheck = useCallback(
		(e) => {
			e.preventDefault();
			setChecked((c) => !c);
			dispatch(
				convAction({
					operation: checked ? 'tag' : '!tag',
					ids,
					tagName: tag.name
				})
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			).then((res: any) => {
				if (res.type.includes('fulfilled')) {
					// deselectAll();
					// replaceHistory(`/folder/${folderId}/`);
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `tag`,
						replace: true,
						hideButton: true,
						type: 'info',
						label: t('snackbar.email_moved_to_trash', 'E-mail moved to Trash'),
						autoHideTimeout: 3000
					});
				} else {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `tag`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		},
		[checked, ids, createSnackbar, dispatch, t, tag.name]
	);
	const tagIcon = useMemo(() => (checked ? 'Untag' : 'TagOutline'), [checked]);
	const tagColor = useMemo(() => ZIMBRA_STANDARD_COLORS[tag.color || 0].hex, [tag.color]);
	return (
		<Row takeAvailableSpace mainAlignment="flex-start">
			<Padding right="small">
				<Checkbox value={checked} onClick={toggleCheck} />
			</Padding>
			<Row takeAvailableSpace mainAlignment="space-between">
				<Padding right="small">
					<Text size="small">{tag.name}</Text>
				</Padding>
				<Icon icon={tagIcon} color={tagColor} />
			</Row>
		</Row>
	);
};

export const applyMultiTag = ({
	t,
	tags,
	ids,
	conversations
}: {
	t: TFunction;
	conversations: any;
	tags: any;
	ids: string[];
}): ReturnType => {
	const tagItem = reduce(
		tags,
		(acc, v) => {
			const item = {
				id: v.id,
				label: v.name,
				icon: 'TagOutline',
				customComponent: (
					<MultiSelectTagsDropdownItem
						tag={v}
						tags={tags}
						ids={ids}
						conversations={conversations}
					/>
				)
			};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			acc.push(item);
			return acc;
		},
		[]
	);

	return {
		id: TagsActionsType.Apply,
		icon: 'TagsMoreOutline',
		label: t('label.edit_tags', 'Edit Tags'),
		items: tagItem
	};
};
export const applyTag = ({
	t,
	conversation,
	tags
}: {
	t: TFunction;
	conversation: any;
	tags: TagsFromStoreType;
}): { id: string; items: TagType[]; customComponent: ReactElement } => {
	const tagItem = reduce(
		tags,
		(acc, v) => {
			const item = {
				id: v.id,
				label: v.name,
				icon: 'TagOutline',
				customComponent: <TagsDropdownItem tag={v} conversation={conversation} />
			};
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			acc.push(item);
			return acc;
		},
		[]
	);

	return {
		id: TagsActionsType.Apply,
		items: tagItem,
		customComponent: (
			<Row takeAvailableSpace mainAlignment="flex-start">
				<Padding right="small">
					<Icon icon="TagsMoreOutline" />
				</Padding>
				<Row takeAvailableSpace mainAlignment="space-between">
					<Padding right="small">
						<Text size="small">{t('label.tags', 'Tags')}</Text>
					</Padding>
				</Row>
			</Row>
		)
	};
};

export const useGetTagsActions = ({ tag, t }: ArgumentType): Array<ReturnType> => {
	const createModal = useContext(ModalManagerContext);
	const createSnackbar = useContext(SnackbarManagerContext);
	return useMemo(
		() => [
			createTag({ t, createModal }),
			editTag({ t, createModal, tag }),
			deleteTag({ t, tag, createSnackbar, createModal })
		],
		[createModal, createSnackbar, t, tag]
	);
};
