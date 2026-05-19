/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import type { Folder } from '@zextras/carbonio-ui-commons';
import { isValidFolderName, ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { find, includes, noop, toLower } from 'lodash';

import { createFolderSoapApi } from 'api/create-folder-soap-api';
import { useUiUtilities } from 'hooks/use-ui-utilities';
import { ModalProps } from 'types/utils';
import { FolderSelector } from 'views/sidebar/commons/folder-selector';
import { useTranslatedSystemFolders } from 'views/sidebar/utils';

export const NewModal: FC<ModalProps> = ({ folder, onClose }) => {
	const DEFAULT_FOLDER_NAME = `${t('folder_panel.modal.new.input.name', 'Enter Folder Name')}*`;
	const [inputValue, setInputValue] = useState(() => t('new_folder', 'New Folder'));
	const [folderDestination, setFolderDestination] = useState<Folder | undefined>(folder);
	const [disabled, setDisabled] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [label, setLabel] = useState<string>(DEFAULT_FOLDER_NAME);
	const [errorMsg, setErrorMsg] = useState<string>(
		t('folder.modal.edit.rename_warning', 'You cannot rename a folder as a system one.')
	);
	const systemFolderNames = useTranslatedSystemFolders();
	const showWarning = useMemo(() => {
		if (
			includes(
				systemFolderNames.map((name) => name.toLowerCase()),
				inputValue.toLowerCase()
			)
		) {
			setErrorMsg(
				t('folder.modal.edit.rename_warning', 'You cannot rename a folder as a system one.')
			);
			return true;
		}
		if (inputValue && !isValidFolderName(inputValue)) {
			setErrorMsg(
				t(
					'folder.modal.edit.invalid_folder_name_warning_msg',
					'Special characters not allowed. Max lenght is 128 characters.'
				)
			);
			return true;
		}
		return false;
	}, [inputValue, systemFolderNames]);

	const { createSnackbar } = useUiUtilities();

	useEffect(() => {
		if (!folderDestination || !inputValue.length || showWarning) {
			setDisabled(true);
			return;
		}
		const value = !!find(
			folderDestination?.children,
			(item) => toLower(item.name) === toLower(inputValue)
		);
		if (value) {
			setLabel(t('folder_panel.modal.new.input.name_exist', 'Name already exists in this path'));
		} else {
			setLabel(DEFAULT_FOLDER_NAME);
		}
		setHasError(value);
		setDisabled(value);
	}, [folderDestination, inputValue, showWarning, DEFAULT_FOLDER_NAME]);

	const onConfirm = useCallback(() => {
		createFolderSoapApi({
			parentFolderId: folderDestination?.id ?? '',
			name: inputValue
		})
			.then((res) => {
				if (!('Fault' in res)) {
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'success',
						label: t('messages.snackbar.folder_created', 'New folder created'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				} else {
					createSnackbar({
						key: `edit`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			})
			.catch(() => noop);
		setInputValue('');
		setLabel(DEFAULT_FOLDER_NAME);
		setFolderDestination(undefined);
		setHasError(false);
		onClose();
	}, [createSnackbar, folderDestination?.id, inputValue, onClose, DEFAULT_FOLDER_NAME]);

	const folderNameRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		folderNameRef.current?.focus();
	}, []);

	return folder ? (
		<Container
			padding={{ all: 'large' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
			style={{
				overflowY: 'auto'
			}}
		>
			<ModalHeader
				title={t('folder_panel.modal.new.title', 'Create a new folder')}
				onClose={onClose}
			/>
			<Container
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
				style={{
					overflowY: 'auto'
				}}
			>
				<Input
					label={label}
					backgroundColor="gray5"
					hasError={hasError || showWarning}
					defaultValue={inputValue}
					onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
					data-testid={'new-folder-name'}
					inputRef={folderNameRef}
				/>
				{showWarning && (
					<Padding all="small">
						<Text size="small" color="error" data-testid="error-message">
							{errorMsg}
						</Text>
					</Padding>
				)}
				<FolderSelector
					selectedFolderId={folderDestination?.id}
					onFolderSelected={setFolderDestination}
					showSharedAccounts
					allowRootSelection
				/>
				<ModalFooter
					onConfirm={onConfirm}
					secondaryAction={onClose}
					label={t('label.create', 'Create')}
					secondaryLabel={t('label.cancel', 'Cancel')}
					disabled={disabled}
					tooltip={
						disabled
							? t('folder.modal.edit.enter_valid_folder_name', 'Enter a valid folder name')
							: ''
					}
				/>
			</Container>
		</Container>
	) : (
		<></>
	);
};
