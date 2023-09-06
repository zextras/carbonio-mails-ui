/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { getBridgedFunctions, t, useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { filter, map } from 'lodash';

export const uploadToFiles = async (
	node: { id: string },
	uploadTo: (arg: { nodeId: string; targetModule: string }) => any
): Promise<unknown> => uploadTo({ nodeId: node.id, targetModule: 'MAILS' });

type UseGetFilesFromDrivePropType = {
	addFilesFromFiles: (filesResponse: useGetFilesFromDriveRespType[]) => void;
};

export type useGetFilesFromDriveRespType = {
	status: string;
	value: {
		attachmentId: string;
	};
};

export const useGetFilesFromDrive = ({
	addFilesFromFiles
}: UseGetFilesFromDrivePropType): [(arg: any) => void, boolean] => {
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
					addFilesFromFiles(success as useGetFilesFromDriveRespType[]);
				});
			}
		},
		[addFilesFromFiles, isAvailable, uploadTo]
	);
	return [confirmAction, isAvailable];
};
