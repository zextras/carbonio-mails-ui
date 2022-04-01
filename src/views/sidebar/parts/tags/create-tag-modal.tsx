/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Padding, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { createTag, updateTag, renameTag } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../../commons/modal-footer';
import { ModalHeader } from '../../commons/modal-header';
import ColorPicker from '../../../../integrations/shared-invite-reply/parts/color-select';

const CreateTagModal: FC<any> = ({ onClose, editMode = false, tag }): ReactElement => {
	console.log('xxx tag:', tag);
	const createSnackbar = useContext(SnackbarManagerContext);
	const [t] = useTranslation();
	const [name, setName] = useState(tag?.name || '');
	const [color, setColor] = useState(tag?.color || 0);
	const title = useMemo(
		() =>
			editMode
				? t('label.edit_tag_name', { name: tag?.name, defaultValue: 'Edit "{{name}}" tag' })
				: t('label.create_tag', 'Create a new Tag'),
		[editMode, t, tag?.name]
	);
	const label = useMemo(() => t('label.tag_name', 'Tag name'), [t]);
	const handleColorChange = useCallback((c: number) => setColor(c), []);
	const handleNameChange = useCallback((ev) => setName(ev.target.value), []);
	const disabled = useMemo(() => name === '', [name]);
	const onCreate = useCallback(
		() =>
			createTag({ name, color }).then((res) => {
				onClose();
				if (res.tag) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					createSnackbar({
						key: `new-tag`,
						replace: true,
						type: 'info',
						label: t('messages.snackbar.tag_created', {
							name,
							defaultValue: 'Tag {{name}} successfully created'
						}),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			}),
		[name, color, onClose, createSnackbar, t]
	);
	const onUpdate = useCallback(() => {
		updateTag({ id: `${tag.id}`, name, color: Number(color) }).then((res) => {
			console.log('xxxx res:', res);
			onClose();
			if (res.action) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				createSnackbar({
					key: `update-tag`,
					replace: true,
					type: 'info',
					label: t('messages.snackbar.tag_updated', {
						name,
						defaultValue: 'Tag successfully updated'
					}),
					autoHideTimeout: 3000,
					hideButton: true
				});
			}
		});
	}, [color, createSnackbar, name, onClose, t, tag.id]);
	return (
		<>
			<ModalHeader onClose={onClose} title={title} />
			<Input label={label} value={name} onChange={handleNameChange} backgroundColor="gray6" />
			<Padding top="small" />
			<ColorPicker
				onChange={handleColorChange}
				t={t}
				label={t('label.select_color', 'Select Color')}
				defaultColor={color}
			/>
			<ModalFooter
				onConfirm={editMode ? onUpdate : onCreate}
				label={editMode ? t('label.create', 'Create') : t('label.create', 'Create')}
				disabled={disabled}
			/>
		</>
	);
};

export default CreateTagModal;
