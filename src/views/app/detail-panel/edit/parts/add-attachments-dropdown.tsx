/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useRef } from 'react';

import { Dropdown, Row, Text, Tooltip, Icon, Padding } from '@zextras/carbonio-design-system';
import { getIntegratedFunction, t } from '@zextras/carbonio-shell-ui';
import { compact } from 'lodash';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';

import * as StyledComp from './edit-view-styled-components';
import {
	useGetFilesFromDrive,
	useGetFilesFromDriveRespType
} from '../edit-utils-hooks/use-get-drive-files';
import { useGetPublicUrl, UseGetPublicUrlRespType } from '../edit-utils-hooks/use-get-public-url';

const SelectorContainer = styled(Row)`
	border-radius: 4px;
	cursor: pointer;
	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

/**
 *
 * @param addFilesFromLocal
 * @param addFilesFromFiles
 * @param addPublicLinkFromFiles
 */
export type AddAttachmentsDropdownProps = {
	addFilesFromLocal: (files: any) => void;
	addFilesFromFiles: (files: useGetFilesFromDriveRespType[]) => void;
	addPublicLinkFromFiles: (files: UseGetPublicUrlRespType[]) => void;
};

export const AddAttachmentsDropdown: FC<AddAttachmentsDropdownProps> = ({
	addFilesFromLocal,
	addFilesFromFiles,
	addPublicLinkFromFiles
}) => {
	const { control } = useForm();
	const inputRef = useRef<any>();

	const [getFilesFromDrive, getFilesAvailable] = useGetFilesFromDrive({ addFilesFromFiles });
	const [getLink, getLinkAvailable] = useGetPublicUrl({ addPublicLinkFromFiles });

	const actionTarget = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: getFilesFromDrive,
			confirmLabel: t('label.select', 'Select'),
			allowFiles: true,
			allowFolders: false
		}),
		[getFilesFromDrive]
	);

	const actionURLTarget = useMemo(
		() => ({
			title: t('label.choose_file', 'Choose file'),
			confirmAction: getLink,
			confirmLabel: t('label.share_public_link', 'Share Public Link'),
			allowFiles: true,
			allowFolders: false
		}),
		[getLink]
	);
	const [getFilesAction, getFilesActionAvailable] = getIntegratedFunction('select-nodes');

	const onFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = null;
			inputRef.current.click();
		}
	}, []);

	const attachmentsItems = useMemo(() => {
		const localItem = {
			id: 'localAttachment',
			icon: 'MonitorOutline',
			label: t('composer.attachment.local', 'Add from local'),
			onClick: onFileClick,
			customComponent: (
				<>
					<Icon icon="MonitorOutline" size="medium" />
					<Padding horizontal="extrasmall" />
					<Text>{t('composer.attachment.local', 'Add from local')}</Text>
				</>
			)
		};

		const contactItem = {
			id: 'contactsModAttachment',
			icon: 'ContactsModOutline',
			label: t('composer.attachment.contacts_mod', 'Add Contact Card'),
			onClick: (): void => {
				// setOpenDD(false);
			},
			disabled: true
		};
		const driveItem =
			getFilesActionAvailable && getFilesAvailable
				? {
						label: t('composer.attachment.files', 'Add from Files'),
						icon: 'DriveOutline',
						onClick: (): void => {
							getFilesAction(actionTarget);
						}
				  }
				: undefined;
		const fileUrl =
			getFilesActionAvailable && getLinkAvailable
				? {
						label: t('composer.attachment.url', 'Add public link from Files'),
						icon: 'Link2',
						onClick: (): void => {
							getFilesAction(actionURLTarget);
						}
				  }
				: undefined;

		return compact([localItem, driveItem, fileUrl, contactItem]);
	}, [
		onFileClick,
		getFilesAvailable,
		actionTarget,
		getFilesActionAvailable,
		getLinkAvailable,
		getFilesAction,
		actionURLTarget
	]);

	return (
		<SelectorContainer orientation="horizontal" mainAlignment="space-between">
			<Controller
				name="attach"
				control={control}
				defaultValue={{}}
				render={(): ReactElement => (
					<StyledComp.FileInput
						type="file"
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						ref={inputRef}
						data-testid="file-input"
						onChange={(): void => {
							addFilesFromLocal(inputRef?.current?.files);
						}}
						multiple
					/>
				)}
			/>
			<Tooltip label={t('tooltip.add_attachments', 'Add attachments')}>
				<Dropdown
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					items={attachmentsItems}
					display="inline-block"
					width="fit"
				>
					<StyledComp.ResizedIconCheckbox onChange={(): null => null} icon="AttachOutline" />
				</Dropdown>
			</Tooltip>
		</SelectorContainer>
	);
};