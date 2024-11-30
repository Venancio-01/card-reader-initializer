CC = gcc
CFLAGS = -Wall -I./
LDFLAGS = -L. -lch9326 -lusb-1.0

TARGET = card_reader_init
SRCS = card_reader_init.c
OBJS = $(SRCS:.c=.o)

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $(OBJS) -o $(TARGET) $(LDFLAGS)

clean:
	rm -f $(OBJS) $(TARGET) 
