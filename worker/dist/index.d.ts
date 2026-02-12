/**
 * 지정된 URL을 기준으로 하위 페이지 목록을 크롤링합니다.
 * @param baseUrl 크롤링을 시작할 루트 URL
 */
export declare function performCrawl(baseUrl: string): Promise<{
    title: string;
    url: string;
}[]>;
//# sourceMappingURL=index.d.ts.map