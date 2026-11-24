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
import { t } from '@zextras/carbonio-shell-ui';
import { TagsActionsType, DeleteTagModal, resolveTagColorHex } from '@zextras/carbonio-ui-commons';

import { UIActionDescriptor } from 'types/actions';
import { ArgumentType, TagActionsReturnType } from 'types/tags';
import CreateUpdateTagModal from 'views/sidebar/parts/tags/create-update-tag-modal';

export const createTag = ({ createModal, closeModal }: ArgumentType): DropdownItem => ({
	id: TagsActionsType.NEW,
	icon: 'TagOutline',
	label: t('label.create_tag', 'Create Tag'),
	onClick: (e: React.SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
		if (e) {
			e.stopPropagation();
		}
		const id = Date.now().toString();
		createModal?.(
			{
				id,
				onClose: (): void => {
					closeModal?.(id);
				},
				focusModalContent: false,
				size: 'medium',
				children: <CreateUpdateTagModal onClose={(): void => closeModal?.(id)} />
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
		createModal?.(
			{
				id,
				onClose: (): void => {
					closeModal?.(id);
				},
				focusModalContent: false,
				size: 'medium',
				children: <CreateUpdateTagModal onClose={(): void => closeModal?.(id)} tag={tag} editMode />
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
		createModal?.(
			{
				id,
				onClose: (): void => {
					closeModal?.(id);
				},
				children: <DeleteTagModal onClose={(): void => closeModal?.(id)} tag={tag} />
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
	const tagColor = useMemo(() => resolveTagColorHex(actionDescriptor), [actionDescriptor]);
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
