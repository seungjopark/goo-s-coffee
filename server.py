#!/usr/bin/env python3
"""
구스커피 주문 관리 시스템 - 로컬 서버 실행 스크립트

사용법:
    python server.py          # 기본 포트 8000
    python server.py 3000     # 포트 3000으로 실행
"""

import http.server
import socketserver
import webbrowser
import sys
import os
from pathlib import Path

def main():
    # 포트 설정
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 올바른 포트 번호를 입력하세요 (예: python server.py 3000)")
            sys.exit(1)
    
    # 현재 디렉토리 확인
    current_dir = Path.cwd()
    index_file = current_dir / "index.html"
    
    if not index_file.exists():
        print("❌ index.html 파일을 찾을 수 없습니다.")
        print(f"   현재 위치: {current_dir}")
        print("   구스커피 프로젝트 폴더에서 실행해주세요.")
        sys.exit(1)
    
    # MIME 타입 설정
    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.svg': 'image/svg+xml'
    })
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print("🚀 구스커피 주문 관리 시스템이 시작되었습니다!")
            print("=" * 50)
            print(f"📍 로컬 주소:   http://localhost:{port}")
            print(f"🌐 네트워크 주소: http://127.0.0.1:{port}")
            print(f"📁 서빙 폴더:   {current_dir}")
            print("=" * 50)
            print("💡 서버를 중지하려면 Ctrl+C를 누르세요")
            print("📱 모바일에서 테스트하려면 같은 WiFi에 연결된 기기에서")
            print(f"   컴퓨터의 IP 주소:포트로 접속하세요 (예: http://192.168.1.100:{port})")
            print()
            
            # 웹 브라우저 자동 열기
            try:
                webbrowser.open(f"http://localhost:{port}")
                print("🎉 기본 브라우저에서 자동으로 열었습니다!")
            except:
                print("💻 브라우저를 수동으로 열고 위 주소로 접속하세요.")
            
            print()
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 포트 {port}이 이미 사용 중입니다.")
            print(f"   다른 포트를 사용해보세요: python server.py {port + 1}")
        else:
            print(f"❌ 서버 시작 실패: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 구스커피 서버가 종료되었습니다. 수고하셨습니다!")
        sys.exit(0)

if __name__ == "__main__":
    main()
