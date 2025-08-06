/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import axios from 'axios';

import { getPublicLinkUrl } from 'api/get-public-link-url';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getPublicLinkUrl', () => {
	const nodeId = 'node-123';

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Happy path', () => {
		it('returns the public URL when GraphQL responds with data', async () => {
			const mockResponse = {
				data: {
					data: {
						createLink: {
							id: 'link-42',
							url: 'https://example.com/share/link-42'
						}
					}
				}
			};
			mockedAxios.post.mockResolvedValueOnce(mockResponse);

			const url = await getPublicLinkUrl(nodeId);

			expect(url).toBe('https://example.com/share/link-42');
			expect(mockedAxios.post).toHaveBeenCalledWith(
				'/services/files/graphql',
				expect.objectContaining({
					operationName: 'createLink',
					variables: { node_id: nodeId },
					query: expect.stringContaining('mutation createLink')
				}),
				expect.objectContaining({
					headers: {
						'Content-Type': 'application/json',
						Pragma: 'no-cache'
					}
				})
			);
		});
	});

	describe('Error handling', () => {
		it('throws if  rejects', async () => {
			mockedAxios.post.mockRejectedValueOnce(new Error('Network failure'));

			await expect(getPublicLinkUrl(nodeId)).rejects.toThrow('createLink failed: Network failure');
		});

		it('wraps non-Error rejections in Error', async () => {
			mockedAxios.post.mockRejectedValueOnce('plain string rejection');

			await expect(getPublicLinkUrl(nodeId)).rejects.toThrow(
				'createLink failed: plain string rejection'
			);
		});
		it('throws if createLink succeeds but no url is returned (missing data)', async () => {
			const mockResponse = { data: { data: null } };
			mockedAxios.post.mockResolvedValueOnce(mockResponse);

			await expect(getPublicLinkUrl(nodeId)).rejects.toThrow(
				'createLink successful but no url returned'
			);
		});
	});
});
