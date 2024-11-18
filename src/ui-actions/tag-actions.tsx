/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import {
	Checkbox,
	DropdownItem,
	Icon,
	Padding,
	Row,
	Text,
	useModal
} from '@zextras/carbonio-design-system';
import { Tag, t, useTags } from '@zextras/carbonio-shell-ui';
import { find, reduce, some } from 'lodash';

import DeleteTagModal from '../carbonio-ui-commons/components/tags/delete-tag-modal';
import { TagsActionsType, ZIMBRA_STANDARD_COLORS } from '../carbonio-ui-commons/constants';
import { StoreProvider } from '../store/redux';
import type { ArgumentType, ItemType, TagActionsReturnType, UIActionDescriptor } from '../types';
import CreateUpdateTagModal from '../views/sidebar/parts/tags/create-update-tag-modal';

export const createTag = ({ createModal, closeModal }: ArgumentType): DropdownItem => ({
	id: TagsActionsType.NEW,
	icon: 'TagOutline',
	label: t('label.create_tag', 'Create Tag'),
	onClick: (e: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
		if (e) {
			e.stopPropagation();
		}
		const id = Date.now().toString();
		createModal &&
			createModal(
				{
					id,
					children: (
						<StoreProvider>
							<CreateUpdateTagModal onClose={(): void => closeModal && closeModal(id)} />
						</StoreProvider>
					)
				},
				true
			);
	}
});

export const editTag = ({ createModal, closeModal, tag }: ArgumentType): DropdownItem => ({
	id: TagsActionsType.EDIT,
	icon: 'Edit2Outline',
	label: t('label.edit_tag', 'Edit Tag'),
	onClick: (e: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
		if (e) {
			e.stopPropagation();
		}
		const id = Date.now().toString();
		createModal &&
			createModal(
				{
					id,
					children: (
						<StoreProvider>
							<CreateUpdateTagModal
								onClose={(): void => closeModal && closeModal(id)}
								tag={tag}
								editMode
							/>
						</StoreProvider>
					)
				},
				true
			);
	}
});

export const deleteTag = ({ createModal, closeModal, tag }: ArgumentType): DropdownItem => ({
	id: TagsActionsType.DELETE,
	icon: 'Untag',
	label: t('label.delete_tag', 'Delete Tag'),
	onClick: (e: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
		if (e) {
			e.stopPropagation();
		}
		const id = Date.now().toString();
		createModal &&
			createModal(
				{
					id,
					children: (
						<StoreProvider>
							<DeleteTagModal onClose={(): void => closeModal && closeModal(id)} tag={tag} />
						</StoreProvider>
					)
				},
				true
			);
	}
});

export const TagsDropdownItem = ({
	checked,
	actionDescriptor
}: {
	checked: boolean;
	actionDescriptor: UIActionDescriptor;
}): ReactElement => {
	const [isHovering, setIsHovering] = useState(false);
	const toggleCheck = useCallback(() => {
		actionDescriptor.execute();
	}, [actionDescriptor]);
	const tagColor = useMemo(
		() => ZIMBRA_STANDARD_COLORS[actionDescriptor.color || 0].hex,
		[actionDescriptor.color]
	);
	const tagIcon = useMemo(() => (checked ? 'Tag' : 'TagOutline'), [checked]);
	const tagIconOnHovered = useMemo(() => (checked ? 'Untag' : 'Tag'), [checked]);

	return (
		<Row
			data-testid={`tag-item-${actionDescriptor.id}`}
			takeAvailableSpace
			mainAlignment="flex-start"
			onClick={toggleCheck}
			onMouseEnter={(): void => setIsHovering(true)}
			onMouseLeave={(): void => setIsHovering(false)}
		>
			<Padding right="small">
				<Checkbox value={checked} />
			</Padding>
			<Row takeAvailableSpace mainAlignment="space-between">
				<Row takeAvailableSpace mainAlignment="flex-start">
					<Text>{actionDescriptor.label}</Text>
				</Row>
				<Row mainAlignment="flex-end">
					<Icon icon={isHovering ? tagIconOnHovered : tagIcon} color={tagColor} />
				</Row>
			</Row>
		</Row>
	);
};

export const useGetTagsActions = ({ tag }: ArgumentType): Array<TagActionsReturnType> => {
	const { createModal, closeModal } = useModal();
	return useMemo(
		() =>
			[
				createTag({ createModal, closeModal }),
				editTag({ createModal, closeModal, tag }),
				deleteTag({ tag, createModal, closeModal })
			] as Array<TagActionsReturnType>,
		[closeModal, createModal, tag]
	);
};

export const useTagsArrayFromStore = (): Array<ItemType> => {
	const tagsFromStore = useTags();
	return useMemo(
		() =>
			reduce(
				tagsFromStore,
				(acc: Array<ItemType>, v: any) => {
					acc.push(v);
					return acc;
				},
				[]
			),
		[tagsFromStore]
	);
};

export const useTagExist = (tags: Array<Tag>): boolean => {
	const tagsArrayFromStore = useTagsArrayFromStore();

	return useMemo(
		() =>
			reduce(
				tags,
				(acc: boolean, v: Tag) => {
					let tmp = false;
					if (
						find(tagsArrayFromStore, { id: v?.id }) ||
						(tags?.length > 0 && some(tags, (tag) => tag.id.includes('nil:')))
					)
						tmp = true;
					return tmp;
				},
				false
			),
		[tags, tagsArrayFromStore]
	);
};
