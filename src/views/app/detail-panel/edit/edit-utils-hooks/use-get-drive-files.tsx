/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getBridgedFunctions, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';
import { useCallback, useMemo } from 'react';
import { useAppSelector } from '../../../../../hooks/redux';
import { selectEditors } from '../../../../../store/editor-slice';
import { MailsEditor } from '../../../../../types';

export const uploadToFiles = async (
	node: { id: string },
	uploadTo: (arg: { nodeId: string; targetModule: string }) => any
): Promise<unknown> => uploadTo({ nodeId: node.id, targetModule: 'MAILS' });

type UseGetFilesFromDrivePropType = {
	editorId: string;
	updateEditorCb: (arg: Partial<MailsEditor>) => void;
	saveDraftCb: (arg: Partial<MailsEditor>) => void;
};
export const useGetFilesFromDrive = ({
	editorId,
	updateEditorCb,
	saveDraftCb
}: UseGetFilesFromDrivePropType): [(arg: any) => void, boolean] => {
	const editors = useAppSelector(selectEditors);
	const editor = useMemo(() => editors[editorId], [editors, editorId]);
	const [uploadTo, isAvailable] = useIntegratedFunction('upload-to-target-and-get-target-id');

	const confirmAction = useCallback(
		(nodes) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const promises = map(nodes, (node) => uploadToFiles(node, uploadTo));

			if (isAvailable) {
				Promise.allSettled(promises).then((res) => {
					const success = filter(res, ['status', 'fulfilled']);
					const allSuccess = res.length === success?.length;
					const allFails = res.length === filter(res, ['status', 'rejected'])?.length;
					const type = allSuccess ? 'info' : 'warning';
					// eslint-disable-next-line no-nested-ternary
					const label = allSuccess
						? t('message.snackbar.all_att_added', 'Attachments added successfully')
						: allFails
						? t(
								'message.snackbar.att_err_adding',
								'There seems to be a problem when adding attachments, please try again'
						  )
						: t(
								'message.snackbar.some_att_add_fails',
								'There seems to be a problem when adding some attachments, please try again'
						  );
					getBridgedFunctions()?.createSnackbar({
						key: `calendar-moved-root`,
						replace: true,
						type,
						hideButton: true,
						label,
						autoHideTimeout: 4000
					});
					const data = {
						attach: {
							...editor.attach,
							aid: map(
								success,
								(i: { value: { attachmentId: string } }) => i?.value?.attachmentId
							).join(',')
						}
					};
					const newEditor = { ...editor, ...data };
					updateEditorCb(newEditor);
					saveDraftCb(newEditor);
				});
			}
		},
		[editor, isAvailable, saveDraftCb, updateEditorCb, uploadTo]
	);

	return [confirmAction, isAvailable];
};
