/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * The Files 'upload-to-target-and-get-target-id' integrated function rejects with a plain
 * object instead of an Error, so the tests must reproduce the very same rejection reason
 */
/* eslint-disable prefer-promise-reject-errors */

import React from 'react';

import { PAYLOAD_TOO_LARGE_STATUS } from '../constants';
import { FileNode, useUploadFromFiles, UseUploadFromFilesParams } from '../use-upload-from-files';
import { screen, setupTest } from '@test-setup';
import { useIntegratedFunction } from '@test-utils/carbonio-shell-ui/carbonio-shell-ui';

const TRIGGER_LABEL = 'upload files';
// the shell t function is mocked to return the i18n key
const ALL_ADDED_LABEL = 'message.snackbar.all_att_added';
const ALL_FAILS_LABEL = 'message.snackbar.att_err_adding';
const SOME_FAILS_LABEL = 'message.snackbar.some_att_add_fails';

const SIZE_EXCEEDED_REASON = {
	status: PAYLOAD_TOO_LARGE_STATUS,
	statusText: 'Payload Too Large'
};
const SERVER_ERROR_REASON = { status: 500, statusText: 'Internal Server Error' };
const ATTACHMENT_ID = 'attachment-1';

type UploadTo = (arg: {
	nodeId: string;
	targetModule: string;
}) => Promise<{ attachmentId: string }>;

const createFileNode = (name: string): FileNode => ({
	id: `node-${name}`,
	name,
	size: 100000,
	mime_type: 'application/pdf',
	__typename: 'File'
});

const HookProbe = ({
	fileNodes,
	...params
}: UseUploadFromFilesParams & { fileNodes: Array<FileNode> }): React.JSX.Element => {
	const [uploadFromFiles] = useUploadFromFiles(params);
	return (
		<button
			onClick={(): void => {
				uploadFromFiles(fileNodes);
			}}
			type="button"
		>
			{TRIGGER_LABEL}
		</button>
	);
};

function setupHook({
	fileNodes,
	uploadTo,
	withFileSizeExceededHandler = true
}: {
	fileNodes: Array<FileNode>;
	uploadTo: UploadTo;
	withFileSizeExceededHandler?: boolean;
}): {
	user: ReturnType<typeof setupTest>['user'];
	onComplete: ReturnType<typeof vi.fn>;
	onFileSizeExceeded: ReturnType<typeof vi.fn>;
} {
	useIntegratedFunction.mockImplementation((id: string) =>
		id === 'upload-to-target-and-get-target-id' ? [uploadTo, true] : [vi.fn(), false]
	);

	const onComplete = vi.fn();
	const onFileSizeExceeded = vi.fn();
	const { user } = setupTest(
		<HookProbe
			fileNodes={fileNodes}
			onComplete={onComplete}
			onFileSizeExceeded={withFileSizeExceededHandler ? onFileSizeExceeded : undefined}
		/>
	);
	return { user, onComplete, onFileSizeExceeded };
}

describe('useUploadFromFiles', () => {
	it('should forward the uploaded attachments and show the success snackbar if every upload succeeds', async () => {
		const fileNode = createFileNode('doc.pdf');
		const { user, onComplete, onFileSizeExceeded } = setupHook({
			fileNodes: [fileNode],
			uploadTo: () => Promise.resolve({ attachmentId: ATTACHMENT_ID })
		});

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByText(ALL_ADDED_LABEL)).toBeVisible();
		expect(onComplete).toHaveBeenCalledWith([
			{
				status: 'fulfilled',
				value: {
					attachmentId: ATTACHMENT_ID,
					fileName: fileNode.name,
					contentType: fileNode.mime_type,
					size: fileNode.size
				}
			}
		]);
		expect(onFileSizeExceeded).not.toHaveBeenCalled();
	});

	it('should pass the nodes to the size exceeded handler without any snackbar if every upload is too large', async () => {
		const fileNodes = [createFileNode('large1.pdf'), createFileNode('large2.pdf')];
		const { user, onComplete, onFileSizeExceeded } = setupHook({
			fileNodes,
			uploadTo: () => Promise.reject(SIZE_EXCEEDED_REASON)
		});

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		await vi.waitFor(() => expect(onFileSizeExceeded).toHaveBeenCalled());
		expect(onFileSizeExceeded).toHaveBeenCalledWith(fileNodes);
		expect(onComplete).toHaveBeenCalledWith([]);
		expect(screen.queryByText(ALL_FAILS_LABEL)).not.toBeInTheDocument();
		expect(screen.queryByText(ALL_ADDED_LABEL)).not.toBeInTheDocument();
	});

	it('should show the generic error snackbar if the upload fails for another reason', async () => {
		const { user, onFileSizeExceeded } = setupHook({
			fileNodes: [createFileNode('doc.pdf')],
			uploadTo: () => Promise.reject(SERVER_ERROR_REASON)
		});

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByText(ALL_FAILS_LABEL)).toBeVisible();
		expect(onFileSizeExceeded).not.toHaveBeenCalled();
	});

	it('should forward each outcome to its handler if the uploads succeed, are too large or fail', async () => {
		const smallNode = createFileNode('small.pdf');
		const tooLargeNode = createFileNode('large.pdf');
		const brokenNode = createFileNode('broken.pdf');
		const { user, onComplete, onFileSizeExceeded } = setupHook({
			fileNodes: [smallNode, tooLargeNode, brokenNode],
			uploadTo: ({ nodeId }) => {
				if (nodeId === tooLargeNode.id) {
					return Promise.reject(SIZE_EXCEEDED_REASON);
				}
				if (nodeId === brokenNode.id) {
					return Promise.reject(SERVER_ERROR_REASON);
				}
				return Promise.resolve({ attachmentId: ATTACHMENT_ID });
			}
		});

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		// the snackbar reports only the outcomes not handled by the size exceeded handler
		expect(await screen.findByText(SOME_FAILS_LABEL)).toBeVisible();
		expect(onComplete).toHaveBeenCalledWith([
			expect.objectContaining({
				status: 'fulfilled',
				value: expect.objectContaining({ fileName: smallNode.name })
			})
		]);
		expect(onFileSizeExceeded).toHaveBeenCalledWith([tooLargeNode]);
	});

	it('should show the success snackbar for the uploaded files if the others are too large', async () => {
		const tooLargeNode = createFileNode('large.pdf');
		const { user, onFileSizeExceeded } = setupHook({
			fileNodes: [createFileNode('small.pdf'), tooLargeNode],
			uploadTo: ({ nodeId }) =>
				nodeId === tooLargeNode.id
					? Promise.reject(SIZE_EXCEEDED_REASON)
					: Promise.resolve({ attachmentId: ATTACHMENT_ID })
		});

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByText(ALL_ADDED_LABEL)).toBeVisible();
		expect(onFileSizeExceeded).toHaveBeenCalledWith([tooLargeNode]);
	});

	it('should report the too large files with the generic error snackbar if there is no size exceeded handler', async () => {
		const { user } = setupHook({
			fileNodes: [createFileNode('large.pdf')],
			uploadTo: () => Promise.reject(SIZE_EXCEEDED_REASON),
			withFileSizeExceededHandler: false
		});

		await user.click(screen.getByRole('button', { name: TRIGGER_LABEL }));

		expect(await screen.findByText(ALL_FAILS_LABEL)).toBeVisible();
	});
});
