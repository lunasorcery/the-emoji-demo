all: textmode-debug textmode-final yx-the-emoji-demo.zip stats

stats: textmode-debug textmode-final yx-the-emoji-demo.zip
	@echo "----- STATS -----"
	@echo "textmode-debug        is `cat textmode-debug|wc -c|trim` bytes"
	@echo "textmode-final        is `cat textmode-final|wc -c|trim` bytes"
	@echo "yx-the-emoji-demo.zip is `cat yx-the-emoji-demo.zip|wc -c|trim` bytes"

yx-the-emoji-demo.zip: textmode-final nfo.txt
	mkdir yx-the-emoji-demo/
	cp textmode-final yx-the-emoji-demo/yx-the-emoji-demo.command
	cp nfo.txt yx-the-emoji-demo/nfo.txt
	cp audio-source-2/nova_2018.* yx-the-emoji-demo/
	zip -r yx-the-emoji-demo.zip yx-the-emoji-demo/
	rm -r yx-the-emoji-demo/

define shelldrop
	@strip $(1)
	@mv $(1) '__'
	@gzip -v -9 '__'
	@echo "cp \044\060 /tmp/z;(sed 1d \044\060|zcat" > $(1)
	@cat '__.gz' >> $(1)
	@rm '__.gz'
	@printf '\x29\x3e\x24\x5f\x3b\x24\x5f\x0a' | dd of=$(1) bs=1 seek=0x21 count=8 conv=notrunc
	@chmod +x $(1)
endef

4klang/4klang.o: 4klang/4klang.asm 4klang/4klang.inc
	cd 4klang && yasm -fmacho 4klang.asm

shader.minified.frag: shader.frag Makefile
	mono /Users/will/Downloads/shader_minifier.exe shader.frag -v -o shader.minified.frag --no-renaming-list I,main

textmode-debug: main.c shader.minified.frag 4klang/4klang.o Makefile
	clang main.c 4klang/4klang.o -o textmode-debug -O3 -framework OpenAL -framework OpenGL -arch i386 -DDEBUG -DHAS_AUDIO -DLOAD_AUDIO

textmode-final: main.c shader.minified.frag 4klang/4klang.o Makefile
	clang main.c 4klang/4klang.o -o textmode-final -O3 -Wl,-dead_strip -framework OpenAL -framework OpenGL -arch i386 -DHAS_AUDIO
	strip textmode-final
	$(call shelldrop,textmode-final)

test: textmode-debug
	./textmode-debug

clean:
	rm -f 4klang/4klang.o
	rm -f textmode-debug
	rm -f textmode-final
	rm -f shader.minified.frag
	rm -f yx-the-emoji-demo.zip
