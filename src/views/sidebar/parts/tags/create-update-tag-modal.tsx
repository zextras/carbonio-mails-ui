/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { FC, ReactElement, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Padding, SnackbarManagerContext, Text } from '@zextras/carbonio-design-system';
import { createTag, renameTag, changeTagColor } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../../commons/modal-footer';
import { ModalHeader } from '../../commons/modal-header';
import ColorPicker from '../../../../integrations/shared-invite-reply/parts/color-select';

type ComponentProps = {
	onClose: () => void;
	editMode?: boolean;
	tag?: {
		CustomComponent: ReactElement;
		active: boolean;
		color: number;
		divider: boolean;
		id: string;
		label: string;
		name: string;
		open: boolean;
	};
};
const NonSupportedCharacters = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/;
const CreateUpdateTagModal: FC<ComponentProps> = ({
	onClose,
	editMode = false,
	tag
}): ReactElement => {
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

	const showMaxLengthWarning = useMemo(() => name.length >= 128, [name]);
	const showSpecialCharWarning = useMemo(() => NonSupportedCharacters.test(name), [name]);

	const showWarning = useMemo(
		() => showMaxLengthWarning || showSpecialCharWarning,
		[showMaxLengthWarning, showSpecialCharWarning]
	);
	const disabled = useMemo(() => name === '' || showWarning, [name, showWarning]);

	const onCreate = useCallback(
		() =>
			createTag({ name, color }).then((res: any) => {
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
				onClose();
			}),
		[name, color, onClose, createSnackbar, t]
	);
	const onUpdate = useCallback(() => {
		Promise.all([renameTag(`${tag?.id}`, name), changeTagColor(`${tag?.id}`, Number(color))])
			.then(() => {
				onClose();
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				createSnackbar({
					key: `update-tag`,
					replace: true,
					type: 'info',
					label: t('messages.snackbar.tag_updated', 'Tag successfully updated'),
					autoHideTimeout: 3000,
					hideButton: true
				});
			})
			.catch(() => {
				onClose();
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				createSnackbar({
					key: `update-tag-error`,
					replace: true,
					type: 'error',
					label: t(
						'messages.snackbar.tag_not_updated',
						'Something went wrong, tag not updated. Please try again.'
					),
					autoHideTimeout: 3000,
					hideButton: true
				});
			});
	}, [color, createSnackbar, name, onClose, t, tag]);

	return (
		<>
			<ModalHeader onClose={onClose} title={title} />
			<Input
				label={label}
				value={name}
				onChange={handleNameChange}
				backgroundColor="gray5"
				textColor={showWarning ? 'error' : 'text'}
				hasError={showWarning}
			/>

			{showWarning && (
				<Padding all="small">
					{showMaxLengthWarning && (
						<Text size="extrasmall" color="error" overflow="break-word">
							{t('label.tag_max_length', 'Max 128 characters are allowed')}
						</Text>
					)}
					{showSpecialCharWarning && (
						<Text size="extrasmall" color="error" overflow="break-word">
							{t('label.no_special_char_allowed', 'Name should not contain any special character')}
						</Text>
					)}
				</Padding>
			)}

			<Padding top="small" />
			<ColorPicker
				onChange={handleColorChange}
				t={t}
				label={t('label.select_color', 'Select Color')}
				defaultColor={color}
			/>
			<ModalFooter
				onConfirm={editMode ? onUpdate : onCreate}
				label={editMode ? t('label.edit', 'edit') : t('label.create', 'Create')}
				disabled={disabled}
			/>
		</>
	);
};

export default CreateUpdateTagModal;
